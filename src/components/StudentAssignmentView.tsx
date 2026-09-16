import React, { useState } from 'react';
import { ActiveScreen } from '../types';
import { ASSETS } from '../data/mockData';

interface StudentAssignmentViewProps {
  onBack: () => void;
  onNavigate: (screen: ActiveScreen) => void;
}

interface UploadedFile {
  name: string;
  size: string;
}

export const StudentAssignmentView: React.FC<StudentAssignmentViewProps> = ({
  onBack,
  onNavigate
}) => {
  const [studentNotes, setStudentNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionTime, setSubmissionTime] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = Array.from(files).map((f: File) => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, 3));
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSimulateDefaultFiles = () => {
    setUploadedFiles([
      { name: 'Taller1_Algoritmos_Jimenez_Miguel.psc', size: '0.45 MB' },
      { name: 'DiagramaFlujo_PruebasEscritorio.pdf', size: '1.80 MB' }
    ]);
  };

  const handleSubmitAssignment = () => {
    if (uploadedFiles.length === 0) {
      alert('Por favor carga al menos un archivo de tu solución antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setSubmissionTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex text-[#0b1c30]">
      {/* FIXED SIDEBAR */}
      <aside className="hidden lg:flex fixed left-0 top-12 bottom-0 w-72 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex-col justify-between border-r border-[#e5eeff]">
        <div className="flex flex-col">
          <div className="h-16 px-6 flex items-center gap-3 border-b border-[#eff4ff]">
            <div className="w-10 h-10 rounded-xl bg-[#1e40af] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-[#00288e] leading-none tracking-tight">
                Edulink
              </span>
              <span className="text-[11px] font-semibold text-[#444653] leading-none mt-1">
                Portal Escolar
              </span>
            </div>
          </div>

          <nav className="px-3 py-4 flex flex-col gap-1">
            <button
              onClick={() => onNavigate('student_dashboard')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Inicio</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>Mis Asignaturas</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              <span>Calificaciones</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              <span>Horario</span>
            </button>
            <button
              onClick={() => onNavigate('student_assignment')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#1e40af] text-white shadow-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">assignment</span>
              <span>Tareas y Entregas</span>
            </button>
            <button
              onClick={() => onNavigate('family_messaging')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              <span>Foros y encuestas</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">local_library</span>
              <span>Eventos institucionales</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Configuración</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#eff4ff]">
          <div className="bg-[#eff4ff] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5] text-[20px]">verified</span>
              <span className="text-xs text-[#0b1c30] font-bold">Año 2026</span>
            </div>
            <span className="text-xs text-[#444653] font-medium">v2.4</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className="sticky top-12 h-16 bg-white/95 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-[#e5eeff]">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="relative w-full flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#757684] text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar cursos, tareas, profesores..."
                className="w-full h-11 pl-10 pr-4 bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#757684] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 transition-all border border-transparent focus:border-[#0051d5]"
              />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#dbe1ff] text-[#00174b] text-xs font-bold shrink-0">
              Período 1 - 2026
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl text-[#444653] hover:bg-[#eff4ff] transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
            </button>

            <div className="h-8 w-px bg-[#dce9ff]" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:flex flex-col">
                <span className="text-xs text-[#0b1c30] font-bold leading-tight">
                  Miguel Ángel Jiménez
                </span>
                <span className="text-[11px] text-[#444653] leading-tight mt-0.5">
                  Estudiante - Grado 11°B
                </span>
              </div>
              <img
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#1e40af]/20 shadow-xs"
                src={ASSETS.studentAvatar}
              />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
          {/* Top Navigation & Breadcrumbs (Image 3) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-[#e5eeff]">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-[#444653] hover:text-[#00288e] transition-colors font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span>Mis Asignaturas</span>
              </button>
              <span className="material-symbols-outlined text-[#c4c5d5] text-[16px]">chevron_right</span>
              <span className="text-[#444653] font-medium">Programación de Software</span>
              <span className="material-symbols-outlined text-[#c4c5d5] text-[16px]">chevron_right</span>
              <span className="text-[#444653] font-medium">Tareas y Entregas</span>
              <span className="material-symbols-outlined text-[#c4c5d5] text-[16px]">chevron_right</span>
              <span className="text-[#00288e] font-bold">Taller 1: Algoritmos y Lógica</span>
            </div>

            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#0051d5]">arrow_back</span>
              <span>Volver a Tareas</span>
            </button>
          </div>

          {/* Header Banner: Task Title, Context & High-level Badges */}
          <div className="relative overflow-hidden bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#e5eeff]">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#dde1ff]/30 blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-[#dbe1ff]/40 blur-2xl pointer-events-none" />

            <div className="relative flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dde1ff] text-[#001453] text-xs font-bold">
                  <span className="material-symbols-outlined text-[15px]">code</span>
                  Programación de Software
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-[#0051d5]">person</span>
                  Prof. Daniela Álvarez
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-[#0051d5]">grade</span>
                  Puntaje máx: 5.0 pts (20% del período)
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-[#0051d5] font-extrabold">
                    Unidad 1 • Fundamentos Computacionales
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
                    Taller 1: Algoritmos y Lógica de Programación
                  </h1>
                </div>

                {/* Submission Status Chips */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#eff4ff] shadow-xs border border-[#dce9ff]">
                    <span className="material-symbols-outlined text-[#0051d5] text-[20px]">alarm</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#444653] leading-none font-medium">
                        Fecha de entrega
                      </span>
                      <span className="text-xs text-[#0b1c30] font-bold leading-tight mt-0.5">
                        15 Octubre, 11:59 PM
                      </span>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xs border ${
                      isSubmitted
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-[#ffdad6]/60 text-[#93000a] border-[#ffdad6]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isSubmitted ? 'task_alt' : 'hourglass_top'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[11px] leading-none font-semibold">
                        {isSubmitted ? 'Entregado a tiempo' : 'Faltan 4 días'}
                      </span>
                      <span className="text-xs font-bold leading-tight mt-0.5">
                        {isSubmitted ? `Entregado (${submissionTime})` : 'Pendiente de entrega'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Content Layout (65% Left, 35% Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Instructions, Criteria, Teacher Files (lg:col-span-8) */}
            <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
              {/* Activity Instructions Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col gap-6 border border-[#e5eeff]">
                <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-6 rounded-full bg-[#0051d5]" />
                    <h2 className="text-xl font-bold text-[#0b1c30]">Instrucciones de la Actividad</h2>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-[#444653] bg-[#eff4ff] px-3 py-1 rounded-full font-semibold">
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    Grado 11°B
                  </span>
                </div>

                {/* Rich Intro Text */}
                <p className="text-sm sm:text-base text-[#444653] leading-relaxed">
                  Estimados estudiantes, en esta actividad pondremos en práctica los conceptos iniciales de lógica de programación, diagramación de flujo, pseudocódigo en <strong className="text-[#0b1c30] font-bold">PSeInt</strong> y estructuras de control selectivas (simples, dobles y anidadas). Asegúrense de documentar adecuadamente cada algoritmo antes de subir los archivos finales.
                </p>

                {/* Learning Objectives */}
                <div className="bg-[#eff4ff] p-5 rounded-2xl flex flex-col gap-3 border border-[#dce9ff]">
                  <span className="text-sm text-[#00288e] font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Objetivos de Aprendizaje
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-[#0b1c30]">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#0051d5] text-[18px] shrink-0 mt-0.5">check_circle</span>
                      <span>Estructurar lógica algorítmica secuencial y condicional libre de ambigüedades.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#0051d5] text-[18px] shrink-0 mt-0.5">check_circle</span>
                      <span>Dominar la simbología estándar ANSI para diagramas de flujo interactivos.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#0051d5] text-[18px] shrink-0 mt-0.5">check_circle</span>
                      <span>Traducir especificaciones funcionales a pseudocódigo estricto con validaciones.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#0051d5] text-[18px] shrink-0 mt-0.5">check_circle</span>
                      <span>Realizar pruebas de escritorio rigurosas mediante matrices de trazado.</span>
                    </div>
                  </div>
                </div>

                {/* Task Deliverables / Detailed Steps */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-bold text-[#0b1c30]">Puntos a Desarrollar</h3>
                  <div className="flex flex-col gap-3">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4 p-4 bg-[#f8f9ff] rounded-xl hover:bg-[#eff4ff] transition-colors border border-[#e5eeff]">
                      <div className="w-8 h-8 rounded-lg bg-[#1e40af] text-white flex items-center justify-center text-sm font-extrabold shrink-0 shadow-xs">
                        1
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm font-bold text-[#0b1c30]">
                          Diagrama de Flujo: Cálculo y Aprobación de Calificaciones
                        </span>
                        <p className="text-xs text-[#444653] leading-relaxed">
                          Diseñar el diagrama de flujo formal para solicitar las notas de 4 períodos lectivos, calcular el promedio ponderado y emitir un dictamen final (<em className="text-[#0b1c30]">"Aprobado con Distinción"</em>, <em className="text-[#0b1c30]">"Aprobado"</em>, o <em className="text-[#0b1c30]">"Plan de Mejoramiento Requerido"</em>) validando que cada nota oscile estrictamente entre 1.0 y 5.0.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4 p-4 bg-[#f8f9ff] rounded-xl hover:bg-[#eff4ff] transition-colors border border-[#e5eeff]">
                      <div className="w-8 h-8 rounded-lg bg-[#1e40af] text-white flex items-center justify-center text-sm font-extrabold shrink-0 shadow-xs">
                        2
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm font-bold text-[#0b1c30]">
                          Algoritmo en Pseudocódigo: Tarifas Dinámicas de Taquilla
                        </span>
                        <p className="text-xs text-[#444653] leading-relaxed">
                          Implementar en pseudocódigo estándar (PSeInt) o Python la solución para clasificar la edad de asistentes y otorgar descuentos por estrato socioeconómico según la tabla contenida en la guía anexa. Incluir comentarios explicativos por bloque.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4 p-4 bg-[#f8f9ff] rounded-xl hover:bg-[#eff4ff] transition-colors border border-[#e5eeff]">
                      <div className="w-8 h-8 rounded-lg bg-[#1e40af] text-white flex items-center justify-center text-sm font-extrabold shrink-0 shadow-xs">
                        3
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs sm:text-sm font-bold text-[#0b1c30]">
                          Pruebas de Escritorio Documentadas
                        </span>
                        <p className="text-xs text-[#444653] leading-relaxed">
                          Ejecutar al menos 4 corridas manuales con diferentes juegos de datos de prueba (incluyendo casos límite de error de entrada) y registrarlas en la plantilla provista.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evaluation Rubric Table */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0b1c30]">Rúbrica de Evaluación</h3>
                    <span className="text-xs text-[#444653] font-medium">Evaluación cuantitativa 100%</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#e5eeff] text-xs text-[#0b1c30]">
                          <th className="py-3 px-4 font-bold">Criterio</th>
                          <th className="py-3 px-4 font-bold">Descripción</th>
                          <th className="py-3 px-4 font-bold text-right">Ponderación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5eeff] text-xs">
                        <tr className="hover:bg-white/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#0b1c30]">Lógica y Estructura</td>
                          <td className="py-3 px-4 text-[#444653]">
                            Uso correcto de condicionales dobles y múltiples, diagramación ANSI sin ambigüedades.
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-[#00288e]">40% (2.0 pts)</td>
                        </tr>
                        <tr className="hover:bg-white/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#0b1c30]">Sintaxis y Ejecución</td>
                          <td className="py-3 px-4 text-[#444653]">
                            Pseudocódigo ejecutable sin errores semánticos ni sintácticos en PSeInt.
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-[#00288e]">40% (2.0 pts)</td>
                        </tr>
                        <tr className="hover:bg-white/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#0b1c30]">Documentación y Formato</td>
                          <td className="py-3 px-4 text-[#444653]">
                            Pruebas de escritorio completas, comentarios de código y presentación en PDF/ZIP.
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-[#00288e]">20% (1.0 pt)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Attachments from Teacher Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col gap-4 border border-[#e5eeff]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0051d5] text-[22px]">attachment</span>
                    <h2 className="text-base font-bold text-[#0b1c30]">Material de Apoyo y Guías</h2>
                  </div>
                  <span className="text-xs text-[#444653]">2 archivos disponibles</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File 1: PDF Guide */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] transition-all shadow-xs group border border-[#e5eeff]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#0b1c30] truncate group-hover:text-[#00288e] transition-colors">
                          Guia_Taller1_Algoritmos.pdf
                        </span>
                        <span className="text-[11px] text-[#444653]">2.4 MB • Documento PDF</span>
                      </div>
                    </div>
                    <button
                      onClick={() => alert('Descargando Guia_Taller1_Algoritmos.pdf')}
                      className="ml-2 p-2 rounded-lg bg-white hover:bg-[#00288e] hover:text-white text-[#0051d5] transition-all shadow-xs flex items-center justify-center border border-[#e2e8f0] cursor-pointer"
                      title="Descargar Guía"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  </div>

                  {/* File 2: Excel Template */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] transition-all shadow-xs group border border-[#e5eeff]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">table_chart</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#0b1c30] truncate group-hover:text-[#00288e] transition-colors">
                          Plantilla_Pruebas_Escritorio.xlsx
                        </span>
                        <span className="text-[11px] text-[#444653]">450 KB • Hoja de Cálculo</span>
                      </div>
                    </div>
                    <button
                      onClick={() => alert('Descargando Plantilla_Pruebas_Escritorio.xlsx')}
                      className="ml-2 p-2 rounded-lg bg-white hover:bg-[#00288e] hover:text-white text-[#0051d5] transition-all shadow-xs flex items-center justify-center border border-[#e2e8f0] cursor-pointer"
                      title="Descargar Plantilla"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Student Submission Panel (lg:col-span-4) */}
            <div className="lg:col-span-4 flex flex-col gap-6 sticky top-28">
              {/* Submission Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col gap-5 border border-[#e5eeff]">
                {/* Header of Delivery Panel */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0051d5] text-[24px]">upload_file</span>
                    <h2 className="text-lg font-bold text-[#0b1c30]">Tu Entrega</h2>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isSubmitted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#ffdad6] text-[#93000a]'
                    }`}
                  >
                    {isSubmitted ? 'Entregado' : 'Sin entregar'}
                  </span>
                </div>

                {/* Student summary badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                  <img
                    alt="Miguel Ángel Jiménez"
                    className="w-10 h-10 rounded-full object-cover shadow-xs ring-2 ring-white"
                    src={ASSETS.studentAvatar}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#0b1c30] truncate">
                      Miguel Ángel Jiménez
                    </span>
                    <span className="text-[11px] text-[#444653]">
                      Estudiante • Matrícula 2026-11B
                    </span>
                  </div>
                </div>

                {/* Drag & Drop Zone */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0b1c30]">Cargar archivos de la tarea</label>
                    <button
                      type="button"
                      onClick={handleSimulateDefaultFiles}
                      className="text-[11px] text-[#0051d5] hover:underline font-semibold"
                    >
                      + Cargar archivos de ejemplo
                    </button>
                  </div>
                  <div className="relative flex flex-col items-center justify-center p-6 rounded-xl bg-[#eff4ff]/60 hover:bg-[#eff4ff] transition-all cursor-pointer text-center group border-2 border-dashed border-[#c4c5d5] hover:border-[#0051d5]">
                    <input
                      type="file"
                      id="file-input"
                      multiple
                      accept=".pdf,.docx,.zip,.rar,.psc"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-[#0051d5]/10 group-hover:bg-[#0051d5]/20 text-[#0051d5] flex items-center justify-center mb-2 transition-colors">
                      <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">
                        cloud_upload
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#0b1c30]">
                      Arrastra tu archivo aquí
                    </span>
                    <span className="text-[11px] text-[#444653] mt-0.5">
                      o haz clic para examinar archivos locales
                    </span>
                    <div className="mt-3 px-2.5 py-1 rounded-lg bg-[#e5eeff] text-[10px] font-bold text-[#444653]">
                      PDF, DOCX, ZIP o PSC (Máx. 10 MB)
                    </div>
                  </div>
                </div>

                {/* Staged Files Container */}
                <div className="flex flex-col gap-2">
                  {uploadedFiles.length === 0 ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f9ff] shadow-xs border border-[#e5eeff]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[#757684] text-[20px] shrink-0">draft</span>
                        <span className="text-xs text-[#757684] italic truncate">
                          Ningún archivo cargado todavía
                        </span>
                      </div>
                      <span className="text-[11px] text-[#757684] font-medium">0 / 3 adjuntos</span>
                    </div>
                  ) : (
                    uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white shadow-xs border border-[#dce9ff]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">
                            check_circle
                          </span>
                          <span className="text-xs text-[#0b1c30] font-bold truncate">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[11px] text-[#444653] font-medium">{file.size}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-[#ba1a1a] hover:bg-red-50 p-1 rounded-md transition-colors"
                            title="Eliminar archivo"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Teacher Remarks / Comments Field */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0b1c30]">
                      Observaciones para el docente
                    </label>
                    <span className="text-[11px] text-[#757684]">{studentNotes.length}/500</span>
                  </div>
                  <textarea
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Escribe aquí aclaraciones sobre tu entrega, versión de PSeInt utilizada, dudas o notas importantes para el profesor..."
                    className="w-full p-3 bg-[#f8f9ff] rounded-xl text-xs text-[#0b1c30] placeholder:text-[#757684] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 transition-all resize-none border border-[#cbd5e1] focus:border-[#0051d5]"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmitAssignment}
                  disabled={isSubmitting}
                  className={`w-full h-12 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                    isSubmitted
                      ? 'bg-[#1e40af] hover:bg-[#00288e]'
                      : 'bg-[#059669] hover:bg-[#047857]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">
                        progress_activity
                      </span>
                      <span>Enviando Entrega...</span>
                    </>
                  ) : isSubmitted ? (
                    <>
                      <span className="material-symbols-outlined text-[20px]">task_alt</span>
                      <span>¡Tarea Enviada con Éxito! (Reenviar)</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      <span>Enviar Tarea Definitiva</span>
                    </>
                  )}
                </button>

                {/* Reassurance Notice */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#eff4ff] text-[#444653] border border-[#dce9ff]">
                  <span className="material-symbols-outlined text-[#0051d5] text-[18px] shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <p className="text-xs leading-relaxed">
                    Podrás anular y reenviar tu solución cuantas veces sea necesario antes de la fecha límite (15 de Octubre, 11:59 PM). El sistema registra la última versión.
                  </p>
                </div>
              </div>

              {/* Quick Tips Card */}
              <div className="bg-white p-4 rounded-2xl shadow-xs flex flex-col gap-1.5 border border-[#e5eeff]">
                <div className="flex items-center gap-1.5 text-[#0051d5] text-xs font-bold">
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  <span>Consejo Académico</span>
                </div>
                <p className="text-xs text-[#444653] leading-relaxed">
                  Verifica en PSeInt el perfil de lenguaje en <strong className="text-[#0b1c30]">"Estricto"</strong> para asegurarte de que todas las variables estén correctamente declaradas antes de exportar.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
