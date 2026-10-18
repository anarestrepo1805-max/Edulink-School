import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import {
  UserProfile,
  InstitutionalPublicationDoc,
  PublicationSurveyResponse
} from '../types';

/**
 * Optimizes and compresses an image on the client side using HTML5 Canvas.
 * Produces a high-quality 320x320 thumbnail suitable for profile avatars.
 */
function processAndCompressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen inválido o corrupto.'));
      img.onload = () => {
        const targetDim = 320;
        let width = img.width;
        let height = img.height;

        const canvas = document.createElement('canvas');
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el procesador de imágenes.'));
          return;
        }

        // Center crop to square
        let sx = 0;
        let sy = 0;
        let sSize = Math.min(width, height);
        if (width > height) {
          sx = (width - height) / 2;
        } else {
          sy = (height - width) / 2;
        }

        ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, targetDim, targetDim);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('Error al procesar la compresión de la imagen.'));
            }
          },
          'image/jpeg',
          0.86
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads student's profile photo to Firebase Storage (if available)
 * and updates their Firestore document with the new avatar URL.
 * Falls back to an optimized, compressed Base64 Data URL in Firestore if Firebase Storage
 * bucket encounters CORS or permission errors, guaranteeing 100% persistence.
 */
export async function uploadStudentProfilePhoto(
  userId: string,
  file: File,
  currentUser: UserProfile
): Promise<{ success: boolean; avatarUrl: string; updatedUser: UserProfile; message: string }> {
  if (!file) {
    throw new Error('Debes seleccionar un archivo de imagen.');
  }

  // Validate MIME type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Formato de imagen no permitido. Solo se aceptan archivos JPG, PNG o WEBP.');
  }

  // Validate size limit (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen excede el límite de 5 MB. Por favor selecciona una imagen más ligera.');
  }

  // 1. Client-side compression and square crop
  const { blob, dataUrl } = await processAndCompressImage(file);

  let finalAvatarUrl: string = dataUrl;
  let usedStorage = false;

  // 2. Try Firebase Storage upload
  try {
    const fileExtension = 'jpg';
    const storagePath = `user_avatars/${userId}/${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString()
      }
    });

    finalAvatarUrl = await getDownloadURL(storageRef);
    usedStorage = true;
  } catch (storageErr) {
    console.warn('Firebase Storage upload notice (using optimized fallback in Firestore):', storageErr);
    // If Firebase Storage fails or is unconfigured, finalAvatarUrl is the compact 320x320 JPEG DataUrl (~25KB)
    finalAvatarUrl = dataUrl;
  }

  // 3. Persist to Firestore /users/{userId}
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      avatarUrl: finalAvatarUrl,
      updatedAt: new Date().toISOString()
    });
  } catch (fsErr) {
    console.error('Error updating user document in Firestore:', fsErr);
    throw new Error('No se pudo guardar la fotografía en la base de datos de Firestore. Verifica tu conexión.');
  }

  // 4. Update local active session & cache
  const updatedUser: UserProfile = {
    ...currentUser,
    avatarUrl: finalAvatarUrl
  };

  try {
    localStorage.setItem('edulink_active_session', JSON.stringify(updatedUser));
    const localAccountsStr = localStorage.getItem('edulink_registered_users');
    if (localAccountsStr) {
      const accounts = JSON.parse(localAccountsStr);
      if (accounts[userId]) {
        accounts[userId].avatarUrl = finalAvatarUrl;
      }
      if (currentUser.email && accounts[currentUser.email.toLowerCase()]) {
        accounts[currentUser.email.toLowerCase()].avatarUrl = finalAvatarUrl;
      }
      if (currentUser.documentId && accounts[currentUser.documentId]) {
        accounts[currentUser.documentId].avatarUrl = finalAvatarUrl;
      }
      localStorage.setItem('edulink_registered_users', JSON.stringify(accounts));
    }
  } catch (lsErr) {
    console.debug('Local storage sync notice:', lsErr);
  }

  return {
    success: true,
    avatarUrl: finalAvatarUrl,
    updatedUser,
    message: usedStorage
      ? 'Fotografía subida a Firebase Storage y actualizada en tu perfil.'
      : 'Fotografía optimizada y actualizada con éxito en la base de datos institucional.'
  };
}

/**
 * Updates authorized non-protected profile information (e.g., phone, emergency contact).
 * Strict institutional boundary: PROTECTED fields (role, gradeLevel, studentCode, documentId, institution, shift)
 * cannot be altered by students.
 */
export async function updateStudentContactInfo(
  userId: string,
  contactData: { phone?: string; emergencyPhone?: string },
  currentUser: UserProfile
): Promise<UserProfile> {
  const cleanPhone = (contactData.phone || '').trim();
  const cleanEmergency = (contactData.emergencyPhone || '').trim();

  // Save to Firestore
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      phone: cleanPhone,
      emergencyPhone: cleanEmergency,
      updatedAt: new Date().toISOString()
    });
  } catch (fsErr) {
    console.error('Error updating contact info in Firestore:', fsErr);
    throw new Error('Error al actualizar información de contacto en la base de datos.');
  }

  const updatedUser: UserProfile = {
    ...currentUser,
    phone: cleanPhone,
    emergencyPhone: cleanEmergency
  };

  try {
    localStorage.setItem('edulink_active_session', JSON.stringify(updatedUser));
  } catch {}

  return updatedUser;
}

/**
 * Queries real institutional publications and debate forums from Firestore.
 * Does NOT generate mock or fake publications. Returns empty array if none exist.
 */
export async function fetchInstitutionalPublicationsForStudent(
  studentGrade: string,
  _studentGroup: string
): Promise<InstitutionalPublicationDoc[]> {
  try {
    const publicationsRef = collection(db, 'institutional_publications');
    const q = query(publicationsRef, where('status', '==', 'published'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const cleanGrade = studentGrade.trim().toLowerCase();
    const cleanNum = cleanGrade.replace(/[^0-9]/g, '');

    const items: InstitutionalPublicationDoc[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as InstitutionalPublicationDoc;
      const targetGrades = Array.isArray(data.targetGrades) ? data.targetGrades : ['all'];

      // Check if target is 'all', or matches the student's grade/group
      const isTargeted =
        targetGrades.includes('all') ||
        targetGrades.includes('todos') ||
        targetGrades.includes('estudiantes') ||
        targetGrades.some((tg) => {
          const cleanTg = tg.trim().toLowerCase();
          return (
            cleanTg === cleanGrade ||
            (cleanNum && cleanTg.includes(cleanNum)) ||
            cleanGrade.includes(cleanTg)
          );
        });

      if (isTargeted) {
        items.push({
          ...data,
          id: docSnap.id
        });
      }
    });

    // Sort descending by publication date
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return items;
  } catch (err) {
    console.warn('Error reading institutional publications from Firestore:', err);
    return [];
  }
}

/**
 * Checks if a student has already submitted a response to a specific survey.
 */
export async function checkStudentSurveySubmission(
  publicationId: string,
  studentId: string
): Promise<PublicationSurveyResponse | null> {
  try {
    const responseDocRef = doc(db, 'institutional_publications', publicationId, 'responses', studentId);
    const snap = await getDoc(responseDocRef);
    if (snap.exists()) {
      return snap.data() as PublicationSurveyResponse;
    }
  } catch (err) {
    console.debug('Survey submission check notice:', err);
  }
  return null;
}

/**
 * Registers student's response to an official institutional survey in Firestore.
 */
export async function submitStudentSurveyVote(params: {
  publicationId: string;
  studentId: string;
  studentName: string;
  studentGrade: string;
  optionId: string;
  optionText: string;
}): Promise<PublicationSurveyResponse> {
  const { publicationId, studentId, studentName, studentGrade, optionId, optionText } = params;

  const responseDocRef = doc(db, 'institutional_publications', publicationId, 'responses', studentId);
  const responseData: PublicationSurveyResponse = {
    id: `${publicationId}_${studentId}`,
    publicationId,
    studentId,
    studentName,
    studentGrade,
    optionId,
    optionText,
    answeredAt: new Date().toISOString()
  };

  await setDoc(responseDocRef, responseData);
  return responseData;
}
