import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ServicioService } from '../../core/services/servicio.service';
import { Servicio } from '../../interfaces/servicio.interface';
import { ReservaService } from '../../core/services/reserva.service';
import { ConfiguracionService, ConfiguracionNegocio, Festivo } from '../../core/services/configuracion.service';
import { BusquedaService } from '../../core/services/busqueda.service';

interface DiaSemana {
    fecha: Date;
    nombre: string;
    nombreCompleto: string;
    numero: string;
    disponible: boolean;
    esFestivo: boolean;
    horariosManana: { [hora: string]: boolean };
    horariosTarde: { [hora: string]: boolean };
    clasesHorariosManana: { [hora: string]: string };
    clasesHorariosTarde: { [hora: string]: string };
}

interface Semana {
    inicio: Date;
    fin: Date;
    dias: DiaSemana[];
}

interface TrabajadorDisponible {
    id: number;
    nombre: string;
    apellidos: string;
    especialidad: string;
    descripcion?: string;
    disponible: boolean;
    valoracion?: number;
}

@Component({
    selector: 'app-reservar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDividerModule
    ],
    templateUrl: './reservar.page.html',
    styleUrls: ['./reservar.page.scss']
})
export class ReservarPage implements OnInit {
    // Estados básicos
    pasoActual: number = 1;
    fechaSeleccionada: Date | null = null;
    horaSeleccionada: string = '';
    servicioSeleccionado: Servicio | null = null;
    trabajadorSeleccionado: TrabajadorDisponible | null = null;
    notas: string = '';
    loading = false;
    loadingConfig = true;

    // Datos
    semanaActual: Semana | null = null;
    serviciosDisponibles: Servicio[] = [];
    trabajadoresDisponibles: TrabajadorDisponible[] = [];
    configuracion: ConfiguracionNegocio = {
        id: 1,
        nombre_negocio: 'Peluquería Selene',
        horario_apertura: '09:30',
        horario_cierre: '20:00',
        dias_apertura: ['martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
        tiempo_minimo_entre_reservas: 15,
        maximo_reservas_por_dia: 50,
        politica_cancelacion_default: 'flexible'
    };
    festivos: Festivo[] = [];

    // Horarios generados desde configuración
    horariosManana: string[] = [];
    horariosTarde: string[] = [];

    // Búsqueda
    searchTerm: string = '';
    serviciosFiltrados: Servicio[] = [];
    serviciosPeluqueria: Servicio[] = [];
    serviciosEstetica: Servicio[] = [];
    sugerencias: string[] = [];
    mostrarSugerencias: boolean = false;
    loadingBusqueda: boolean = false;

    // Mapa de días para conversión
    // Asegúrate de que estos mapas estén correctos:
    private readonly MAPA_DIAS_COMPLETOS: { [key: string]: string } = {
        'lunes': 'LUN',
        'martes': 'MAR',
        'miercoles': 'MIE',
        'jueves': 'JUE',
        'viernes': 'VIE',
        'sabado': 'SAB',
        'domingo': 'DOM'
    };

    private readonly MAPA_DIAS_INGLES: { [key: string]: string } = {
        'LUN': 'lunes',
        'MAR': 'martes',
        'MIE': 'miercoles',
        'JUE': 'jueves',
        'VIE': 'viernes',
        'SAB': 'sabado',
        'DOM': 'domingo'
    };

    private readonly NOMBRES_DIAS_COMPLETOS: { [key: string]: string } = {
        'LUN': 'Lunes',
        'MAR': 'Martes',
        'MIE': 'Miércoles',
        'JUE': 'Jueves',
        'VIE': 'Viernes',
        'SAB': 'Sábado',
        'DOM': 'Domingo'
    };

    // Días que solo abren por la mañana vs días que abren por la tarde
    private readonly DIAS_SOLO_MANANA: string[] = ['martes', 'jueves', 'sabado'];
    private readonly DIAS_CON_TARDE: string[] = ['miercoles', 'viernes'];

    // Inyectar servicios
    private router = inject(Router);
    private servicioService = inject(ServicioService);
    private reservaService = inject(ReservaService);
    private configuracionService = inject(ConfiguracionService);
    private busquedaService = inject(BusquedaService);
    private snackBar = inject(MatSnackBar);
    private cdr = inject(ChangeDetectorRef);

    ngOnInit() {
        this.cargarConfiguracion();
        this.cargarServiciosDisponibles();
    }

    // ====================
    // GETTERS PARA EL TEMPLATE
    // ====================

    get fechaSeleccionadaFormateada(): string {
        return this.fechaSeleccionada ? this.formatDateSpanish(this.fechaSeleccionada) : '';
    }

    get servicioSeleccionadoNombre(): string {
        return this.servicioSeleccionado ? this.servicioSeleccionado.nombre : '';
    }

    get trabajadorSeleccionadoNombre(): string {
        if (this.trabajadorSeleccionado) {
            return `${this.trabajadorSeleccionado.nombre} ${this.trabajadorSeleccionado.apellidos}`;
        }
        return '';
    }

    get precioFormateado(): string {
        return this.servicioSeleccionado ? this.formatCurrency(this.servicioSeleccionado.precio) : '';
    }

    get horarioMananaTexto(): string {
        if (!this.horariosManana.length) return 'Mañana (No disponible)';
        const inicio = this.horariosManana[0];
        const fin = '12:30';
        return `Mañana (${inicio} - ${fin})`;
    }

    get horarioTardeTexto(): string {
        if (!this.horariosTarde.length) return 'Tarde (No disponible)';
        const inicio = this.horariosTarde[0];
        const fin = '19:30';
        return `Tarde (${inicio} - ${fin})`;
    }

    // ====================
    // INICIALIZACIÓN
    // ====================

    // Modifica el método cargarConfiguracion:
    private cargarConfiguracion() {
        this.loadingConfig = true;
        this.configuracionService.getConfiguracion().subscribe({
            next: (response: any) => {
                console.log('✅ Respuesta completa del backend:', response);

                // Extraer los datos reales de la respuesta
                let configData = response;

                // Si la respuesta tiene estructura {success: true, data: {...}}
                if (response && typeof response === 'object' && 'data' in response) {
                    configData = response.data;
                    console.log('✅ Datos extraídos:', configData);
                }

                // Si todavía no tenemos datos, usar valores por defecto
                if (!configData) {
                    console.warn('⚠️ No se recibieron datos de configuración, usando valores por defecto');
                    configData = {
                        nombre_negocio: 'Peluquería Selene',
                        horario_apertura: '09:30',
                        horario_cierre: '20:00',
                        dias_apertura: ['martes', 'miercoles', 'viernes', 'sabado'], // Sin jueves
                        tiempo_minimo_entre_reservas: 15,
                        maximo_reservas_por_dia: 50,
                        politica_cancelacion_default: 'flexible'
                    };
                }

                // Asegurarnos de que dias_apertura sea un array válido
                let diasAperturaArray: string[] = [];

                if (Array.isArray(configData.dias_apertura)) {
                    diasAperturaArray = configData.dias_apertura;
                } else if (typeof configData.dias_apertura === 'string') {
                    try {
                        // Intentar parsear si viene como string JSON
                        diasAperturaArray = JSON.parse(configData.dias_apertura);
                    } catch (e) {
                        console.error('Error parseando dias_apertura:', e);
                        diasAperturaArray = ['martes', 'miercoles', 'viernes', 'sabado'];
                    }
                } else {
                    diasAperturaArray = ['martes', 'miercoles', 'viernes', 'sabado'];
                }

                // Actualizar la configuración
                this.configuracion = {
                    id: configData.id || 1,
                    nombre_negocio: configData.nombre_negocio || 'Peluquería Selene',
                    horario_apertura: configData.horario_apertura || '09:30',
                    horario_cierre: configData.horario_cierre || '20:00',
                    dias_apertura: diasAperturaArray,
                    tiempo_minimo_entre_reservas: configData.tiempo_minimo_entre_reservas || 15,
                    maximo_reservas_por_dia: configData.maximo_reservas_por_dia || 50,
                    politica_cancelacion_default: configData.politica_cancelacion_default || 'flexible'
                };

                console.log('🔍 Configuración final aplicada:', this.configuracion);
                console.log('🔍 Días de apertura:', this.configuracion.dias_apertura);

                // Generar horarios basados en la configuración
                this.generarHorariosDesdeConfiguracion();

                // Generar semana inicial
                this.semanaActual = this.generarSemana(new Date());
                this.loadingConfig = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('❌ Error cargando configuración:', error);

                // Usar valores por defecto (sin jueves)
                this.configuracion.dias_apertura = ['martes', 'miercoles', 'viernes', 'sabado'];

                this.generarHorariosDesdeConfiguracion();
                this.semanaActual = this.generarSemana(new Date());
                this.loadingConfig = false;
                this.cdr.detectChanges();
            }
        });
    }

    // ====================
    // HORARIOS Y CALENDARIO
    // ====================

    private generarHorariosDesdeConfiguracion() {
        // Asegurarnos de que las horas estén en formato HH:MM (sin segundos)
        let horaApertura = this.configuracion.horario_apertura || '09:30';
        let horaCierre = this.configuracion.horario_cierre || '20:00';

        // Si las horas vienen con segundos, quitarlos
        if (horaApertura.includes(':') && horaApertura.split(':').length > 2) {
            const partes = horaApertura.split(':');
            horaApertura = `${partes[0]}:${partes[1]}`;
        }

        if (horaCierre.includes(':') && horaCierre.split(':').length > 2) {
            const partes = horaCierre.split(':');
            horaCierre = `${partes[0]}:${partes[1]}`;
        }

        console.log('🕐 Horas procesadas:', { horaApertura, horaCierre });

        // Generar horarios de mañana: desde horario_apertura hasta 12:30
        this.horariosManana = this.generarHorariosConIntervalo(
            horaApertura,
            '12:30',
            this.configuracion.tiempo_minimo_entre_reservas || 15
        );

        // Generar horarios de tarde: desde 17:00 hasta horario_cierre (pero máximo 19:30)
        const horarioTardeFin = this.obtenerHorarioTardeFin(horaCierre);
        this.horariosTarde = this.generarHorariosConIntervalo(
            '17:00',
            horarioTardeFin,
            this.configuracion.tiempo_minimo_entre_reservas || 15
        );

        console.log('🕐 Horarios generados:', {
            manana: this.horariosManana,
            tarde: this.horariosTarde
        });
    }

    private obtenerHorarioTardeFin(horaCierre: string): string {
        if (!horaCierre) return '19:30';

        const [cierreHoraStr, cierreMinutoStr] = horaCierre.split(':');
        const cierreHora = parseInt(cierreHoraStr, 10);
        const cierreMinuto = parseInt(cierreMinutoStr || '0', 10);
        const cierreTotal = cierreHora * 60 + cierreMinuto;

        // Máximo hasta las 19:30
        if (cierreTotal >= 19 * 60 + 30) {
            return '19:30';
        }

        // Si cierra antes de las 19:30, usar la hora de cierre
        return horaCierre;
    }

    private generarHorariosConIntervalo(inicio: string, fin: string, intervaloMinutos: number): string[] {
        const horarios: string[] = [];
        const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
        const [horaFin, minutoFin] = fin.split(':').map(Number);

        const totalMinutosInicio = horaInicio * 60 + minutoInicio;
        const totalMinutosFin = horaFin * 60 + minutoFin;

        if (totalMinutosFin <= totalMinutosInicio) {
            console.warn('Horario de fin debe ser después del horario de inicio:', { inicio, fin });
            return horarios;
        }

        for (let minutos = totalMinutosInicio; minutos <= totalMinutosFin; minutos += intervaloMinutos) {
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;

            if (horas > horaFin || (horas === horaFin && mins > minutoFin)) {
                break;
            }

            const horaStr = horas.toString().padStart(2, '0');
            const minutoStr = mins.toString().padStart(2, '0');
            horarios.push(`${horaStr}:${minutoStr}`);
        }

        return horarios;
    }

    private generarSemana(fecha: Date): Semana {
        const inicioSemana = new Date(fecha);
        const diaSemana = inicioSemana.getDay();
        const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
        inicioSemana.setDate(inicioSemana.getDate() + diff);

        const dias: DiaSemana[] = [];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // SIEMPRE generamos 6 días (de lunes a sábado)
        for (let i = 0; i < 6; i++) {
            const dia = new Date(inicioSemana);
            dia.setDate(inicioSemana.getDate() + i);
            dia.setHours(0, 0, 0, 0);

            const nombreDia = this.getNombreDia(dia.getDay());
            const nombreDiaLower = this.convertirDiaInglesAEspanol(nombreDia);
            const esFestivo = this.esFestivo(dia);
            const diaYaPasado = dia < hoy;

            // Verificar si el día está en los días de apertura configurados
            const estaAbierto = this.configuracion.dias_apertura.includes(nombreDiaLower);

            const horariosManana: { [hora: string]: boolean } = {};
            const horariosTarde: { [hora: string]: boolean } = {};
            const clasesHorariosManana: { [hora: string]: string } = {};
            const clasesHorariosTarde: { [hora: string]: string } = {};

            // SIEMPRE generar horarios de mañana para TODOS los días
            // Solo disponibles si el día está abierto, no es festivo, no ha pasado y el horario no ha pasado
            this.horariosManana.forEach(hora => {
                const disponible = estaAbierto && !esFestivo && !diaYaPasado && !this.esHorarioPasado(dia, hora);
                horariosManana[hora] = disponible;
                clasesHorariosManana[hora] = disponible ? 'horario-disponible' : 'horario-no-disponible';
            });

            // SIEMPRE generar horarios de tarde para TODOS los días
            // Solo disponibles si el día está abierto, está en DIAS_CON_TARDE, no es festivo, no ha pasado y el horario no ha pasado
            const tieneTardePermitida = estaAbierto && this.DIAS_CON_TARDE.includes(nombreDiaLower);

            this.horariosTarde.forEach(hora => {
                const disponible = tieneTardePermitida && !esFestivo && !diaYaPasado && !this.esHorarioPasado(dia, hora);
                horariosTarde[hora] = disponible;
                clasesHorariosTarde[hora] = disponible ? 'horario-disponible' : 'horario-no-disponible';
            });

            dias.push({
                fecha: dia,
                nombre: nombreDia,
                nombreCompleto: this.NOMBRES_DIAS_COMPLETOS[nombreDia] || nombreDia,
                numero: dia.getDate().toString(),
                disponible: estaAbierto && !esFestivo && !diaYaPasado,
                esFestivo: esFestivo,
                horariosManana: horariosManana,
                horariosTarde: horariosTarde,
                clasesHorariosManana: clasesHorariosManana,
                clasesHorariosTarde: clasesHorariosTarde
            });
        }

        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 5);

        return {
            inicio: inicioSemana,
            fin: finSemana,
            dias: dias
        };
    }

    private esHorarioPasado(dia: Date, hora: string): boolean {
        const ahora = new Date();
        const fechaHoraSeleccionada = new Date(dia);

        // Parsear la hora (formato "HH:MM")
        const [horas, minutos] = hora.split(':').map(Number);
        fechaHoraSeleccionada.setHours(horas, minutos, 0, 0);

        // Comparar con el momento actual
        return fechaHoraSeleccionada < ahora;
    }

    private regenerarSemana() {
        if (this.semanaActual) {
            this.semanaActual = this.generarSemana(this.semanaActual.inicio);
            this.cdr.detectChanges();
        }
    }

    private esFestivo(fecha: Date): boolean {
        const fechaStr = this.formatDate(fecha);
        return this.festivos.some(festivo => festivo.fecha === fechaStr);
    }

    private calcularDisponibilidad(dia: Date, hora: string, turno: 'manana' | 'tarde'): boolean {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (dia < hoy) return false;

        const fechaHoraSeleccionada = new Date(dia);
        const [horas, minutos] = hora.split(':').map(Number);
        fechaHoraSeleccionada.setHours(horas, minutos, 0, 0);

        if (fechaHoraSeleccionada < new Date()) return false;

        // Para la tarde, verificar si el día está en DIAS_CON_TARDE (ya se verifica en generarSemana)
        // Aquí solo verificamos si la hora está dentro del horario generado
        if (turno === 'manana') {
            return this.horariosManana.includes(hora);
        } else {
            return this.horariosTarde.includes(hora);
        }
    }

    private convertirDiaInglesAEspanol(diaIngles: string): string {
        const convertido = this.MAPA_DIAS_INGLES[diaIngles] || diaIngles.toLowerCase();
        console.log(`🔍 Conversión: ${diaIngles} -> ${convertido}`);
        return convertido;
    }

    private convertirDiaEspanolAIngles(diaEspanol: string): string {
        return this.MAPA_DIAS_COMPLETOS[diaEspanol.toLowerCase()] || diaEspanol.toUpperCase();
    }

    private getNombreDia(dia: number): string {
        const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
        return dias[dia];
    }

    esDiaDisponible(fecha: Date): boolean {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fecha < hoy) return false;

        const diaSemana = fecha.getDay();
        const nombreDia = this.getNombreDia(diaSemana);
        const nombreDiaLower = this.convertirDiaInglesAEspanol(nombreDia);

        // Verificar si el día está en los días de apertura
        const estaAbierto = this.configuracion.dias_apertura.includes(nombreDiaLower);

        if (!estaAbierto) return false;

        // Verificar si tiene al menos un turno (mañana siempre, tarde solo en DIAS_CON_TARDE)
        const tieneTarde = this.DIAS_CON_TARDE.includes(nombreDiaLower);

        return this.horariosManana.length > 0 || (tieneTarde && this.horariosTarde.length > 0);
    }

    // Métodos para el template
    esHorarioDisponible(dia: DiaSemana, hora: string, turno: 'manana' | 'tarde'): boolean {
        if (turno === 'manana') {
            // DEBUG: Agregar log
            const disponible = dia.horariosManana ? dia.horariosManana[hora] || false : false;
            console.log(`🔍 Horario ${hora} (${turno}) en ${dia.nombre}: ${disponible}`);
            return disponible;
        } else {
            const disponible = dia.horariosTarde ? dia.horariosTarde[hora] || false : false;
            console.log(`🔍 Horario ${hora} (${turno}) en ${dia.nombre}: ${disponible}`);
            return disponible;
        }
    }

    getClaseHorarioPrecalculada(dia: DiaSemana, hora: string, turno: 'manana' | 'tarde'): string {
        if (dia.esFestivo) return 'horario-festivo';

        if (turno === 'manana') {
            const baseClass = dia.clasesHorariosManana[hora] || 'horario-no-disponible';

            if (baseClass === 'horario-disponible' && this.fechaSeleccionada && this.horaSeleccionada) {
                const estaSeleccionado =
                    dia.fecha.getDate() === this.fechaSeleccionada.getDate() &&
                    dia.fecha.getMonth() === this.fechaSeleccionada.getMonth() &&
                    dia.fecha.getFullYear() === this.fechaSeleccionada.getFullYear() &&
                    this.horaSeleccionada === hora;

                return estaSeleccionado ? 'horario-seleccionado' : baseClass;
            }

            return baseClass;
        } else {
            const baseClass = dia.clasesHorariosTarde[hora] || 'horario-no-disponible';

            if (baseClass === 'horario-disponible' && this.fechaSeleccionada && this.horaSeleccionada) {
                const estaSeleccionado =
                    dia.fecha.getDate() === this.fechaSeleccionada.getDate() &&
                    dia.fecha.getMonth() === this.fechaSeleccionada.getMonth() &&
                    dia.fecha.getFullYear() === this.fechaSeleccionada.getFullYear() &&
                    this.horaSeleccionada === hora;

                return estaSeleccionado ? 'horario-seleccionado' : baseClass;
            }

            return baseClass;
        }
    }

    // =========
    // SERVICIOS 
    // =========

    cargarServiciosDisponibles() {
        this.servicioService.getServicios().subscribe({
            next: (servicios) => {
                this.serviciosDisponibles = servicios;
                console.log('✅ Servicios cargados:', this.serviciosDisponibles.length);
                this.filtrarServicios();
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error cargando servicios:', err);
                this.serviciosDisponibles = [];
                this.filtrarServicios();
                this.snackBar.open('Error al cargar los servicios', 'Cerrar', { duration: 3000 });
                this.cdr.detectChanges();
            }
        });
    }

    // Usar BusquedaService para búsquedas
    buscarServicios() {
        this.mostrarSugerencias = false;

        if (!this.searchTerm.trim()) {
            this.filtrarServicios();
            return;
        }

        this.loadingBusqueda = true;

        this.busquedaService.buscarServicios(this.searchTerm).subscribe({
            next: (response) => {
                this.loadingBusqueda = false;
                console.log('✅ Resultados búsqueda:', response);

                if (response && response.servicios) {
                    this.serviciosFiltrados = response.servicios;
                    this.separarServiciosPorCategoria();
                } else {
                    this.serviciosFiltrados = [];
                    this.separarServiciosPorCategoria();
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loadingBusqueda = false;
                console.error('❌ Error en búsqueda:', err);
                this.filtrarServicios();
                this.snackBar.open('Error en la búsqueda, mostrando resultados locales', 'Cerrar', { duration: 3000 });
                this.cdr.detectChanges();
            }
        });
    }

    obtenerSugerencias() {
        if (this.searchTerm.trim().length < 2) {
            this.sugerencias = [];
            this.mostrarSugerencias = false;
            return;
        }

        this.busquedaService.obtenerSugerencias(this.searchTerm).subscribe({
            next: (response) => {
                this.sugerencias = response.sugerencias || [];
                this.mostrarSugerencias = this.sugerencias.length > 0;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al obtener sugerencias:', error);
                this.sugerencias = [];
                this.mostrarSugerencias = false;
            }
        });
    }

    private filtrarServicios() {
        let servicios = this.serviciosDisponibles;

        if (this.searchTerm.trim()) {
            servicios = servicios.filter(servicio =>
                servicio.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                servicio.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                servicio.categoria.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }

        this.serviciosFiltrados = servicios;
        this.separarServiciosPorCategoria();
    }

    private separarServiciosPorCategoria() {
        this.serviciosPeluqueria = this.serviciosFiltrados.filter(s =>
            s.categoria.toLowerCase().includes('peluquería') ||
            s.categoria.toLowerCase().includes('peluqueria')
        );

        this.serviciosEstetica = this.serviciosFiltrados.filter(s =>
            s.categoria.toLowerCase().includes('estética') ||
            s.categoria.toLowerCase().includes('estetica')
        );
    }

    seleccionarSugerencia(sugerencia: string) {
        this.searchTerm = sugerencia;
        this.mostrarSugerencias = false;
        this.buscarServicios();
    }

    limpiarBusqueda() {
        this.searchTerm = '';
        this.sugerencias = [];
        this.mostrarSugerencias = false;
        this.filtrarServicios();
    }

    // ====================
    // TRABAJADORES
    // ====================

    cargarTrabajadoresDisponibles() {
        if (!this.fechaSeleccionada || !this.horaSeleccionada || !this.servicioSeleccionado) return;

        this.loading = true;
        this.trabajadoresDisponibles = [];

        const fechaStr = this.formatDate(this.fechaSeleccionada);

        this.reservaService.getTrabajadoresDisponibles(
            this.servicioSeleccionado.id,
            fechaStr,
            this.horaSeleccionada
        ).subscribe({
            next: (response) => {
                this.loading = false;
                console.log('✅ Respuesta recibida en componente:', response);

                // VERIFICAR SI ES UN CONFLICTO DE HORARIO
                if (response.codigo === 'CONFLICTO_HORARIO_CLIENTE') {
                    console.log('ℹ️ Conflicto de horario detectado (manejado como next):', response);

                    this.snackBar.open(response.error, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-warning']
                    });

                    // Limpiar selección y volver al paso 1
                    this.fechaSeleccionada = null;
                    this.horaSeleccionada = '';
                    this.pasoActual = 1;
                    this.trabajadoresDisponibles = [];
                    this.cdr.detectChanges();
                    return;
                }

                // VERIFICAR SI ES UN ERROR DE DOBLE RESERVA (para compatibilidad)
                if (response.error && response.error.includes('Ya tienes una reserva en ese horario')) {
                    console.log('ℹ️ Error de doble reserva (estructura antigua):', response);

                    this.snackBar.open(response.detalles?.mensaje || response.error, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-warning']
                    });

                    this.fechaSeleccionada = null;
                    this.horaSeleccionada = '';
                    this.pasoActual = 1;
                    this.trabajadoresDisponibles = [];
                    this.cdr.detectChanges();
                    return;
                }

                // CARGAR TRABAJADORES DISPONIBLES
                if (response && response.trabajadores) {
                    this.trabajadoresDisponibles = response.trabajadores.map((t: any) => {
                        let especialidadesArray: string[] = [];

                        if (Array.isArray(t.especialidades)) {
                            especialidadesArray = t.especialidades;
                        } else if (typeof t.especialidades === 'string') {
                            try {
                                especialidadesArray = JSON.parse(t.especialidades);
                            } catch (e) {
                                console.warn('❌ Error parseando especialidades:', t.especialidades);
                                especialidadesArray = [t.especialidades];
                            }
                        }

                        return {
                            id: t.id,
                            nombre: t.nombre,
                            apellidos: t.apellidos,
                            especialidad: especialidadesArray.length > 0 ? especialidadesArray.join(', ') : t.descripcion || 'Especialista',
                            descripcion: t.descripcion,
                            disponible: true,
                            valoracion: t.valoracion || 4.5
                        };
                    });

                    console.log(`✅ ${this.trabajadoresDisponibles.length} trabajadores cargados`);
                } else {
                    this.trabajadoresDisponibles = [];
                    console.warn('⚠️ No se recibieron trabajadores en la respuesta');
                }

                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loading = false;

                console.error('❌ Error REAL al cargar trabajadores disponibles:', err);

                let errorMessage = 'Error del sistema al cargar disponibilidad';

                if (err.status === 0) {
                    errorMessage = 'Error de conexión - Verifica tu internet';
                } else if (err.status >= 500) {
                    errorMessage = 'Error del servidor - Intenta más tarde';
                }

                this.snackBar.open(errorMessage, 'Cerrar', {
                    duration: 5000,
                    panelClass: ['snackbar-error']
                });

                this.trabajadoresDisponibles = [];
                this.cdr.detectChanges();
            }
        });
    }

    // ====================
    // NAVEGACIÓN Y SELECCIÓN
    // ====================

    seleccionarHorario(dia: DiaSemana, hora: string, turno: 'manana' | 'tarde') {
        let disponible = false;

        if (turno === 'manana') {
            disponible = dia.horariosManana[hora] || false;
        } else {
            disponible = dia.horariosTarde[hora] || false;
        }

        if (!disponible) return;

        this.fechaSeleccionada = new Date(dia.fecha);
        this.horaSeleccionada = hora;
        this.pasoActual = 2;
        this.cdr.detectChanges();
    }

    seleccionarServicio(servicio: Servicio) {
        console.log('🔍 Servicio seleccionado:', {
            id: servicio.id,
            nombre: servicio.nombre,
            duracion: servicio.duracion,
            precio: servicio.precio
        });

        this.servicioSeleccionado = servicio;
        this.cdr.detectChanges();
    }

    seleccionarTrabajador(trabajador: TrabajadorDisponible) {
        this.trabajadorSeleccionado = trabajador;
        this.cdr.detectChanges();
    }

    semanaAnterior() {
        if (this.semanaActual) {
            const nuevaFecha = new Date(this.semanaActual.inicio);
            nuevaFecha.setDate(nuevaFecha.getDate() - 7);
            this.semanaActual = this.generarSemana(nuevaFecha);
            this.cdr.detectChanges();
        }
    }

    siguienteSemana() {
        if (this.semanaActual) {
            const nuevaFecha = new Date(this.semanaActual.inicio);
            nuevaFecha.setDate(nuevaFecha.getDate() + 7);
            this.semanaActual = this.generarSemana(nuevaFecha);
            this.cdr.detectChanges();
        }
    }

    pasoAnterior() {
        if (this.pasoActual > 1) {
            this.pasoActual--;
            this.cdr.detectChanges();
        }
    }

    siguientePaso() {
        if (this.pasoActual < 4 && this.puedeAvanzar()) {
            this.pasoActual++;

            if (this.pasoActual === 3) {
                this.cargarTrabajadoresDisponibles();
            }

            this.cdr.detectChanges();
        }
    }

    puedeAvanzar(): boolean {
        switch (this.pasoActual) {
            case 1: return !!this.fechaSeleccionada && !!this.horaSeleccionada;
            case 2: return !!this.servicioSeleccionado;
            case 3: return !!this.trabajadorSeleccionado;
            default: return false;
        }
    }

    // ====================
    // RESERVA
    // ====================

    confirmarReserva() {
        if (!this.validarReservaCompleta()) {
            this.snackBar.open('Por favor, completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
            return;
        }

        console.log('🔍 Datos que se enviarán a la reserva:', {
            servicio_id: this.servicioSeleccionado!.id,
            trabajador_id: this.trabajadorSeleccionado!.id,
            fecha_reserva: this.formatDate(this.fechaSeleccionada!),
            hora_inicio: this.horaSeleccionada,
            notas: this.notas,
            servicio_nombre: this.servicioSeleccionado!.nombre,
            servicio_duracion: this.servicioSeleccionado!.duracion
        });

        this.loading = true;

        const reservaData = {
            servicio_id: this.servicioSeleccionado!.id,
            fecha_reserva: this.formatDate(this.fechaSeleccionada!),
            hora_inicio: this.horaSeleccionada,
            trabajador_id: this.trabajadorSeleccionado!.id,
            notas: this.notas
        };

        this.reservaService.crearReserva(reservaData).subscribe({
            next: (response) => {
                this.loading = false;
                this.snackBar.open('¡Reserva creada exitosamente!', 'Cerrar', {
                    duration: 5000,
                    panelClass: ['snackbar-success']
                });
                this.router.navigate(['/mis-reservas']);
            },
            error: (err) => {
                this.loading = false;
                console.error('Error creando reserva:', err);

                let errorMsg = err.error?.error || 'Error al crear la reserva';

                // Manejo específico para conflictos de horario en la creación
                if (err.status === 409 || err.error?.error?.includes('Ya tienes una reserva en ese horario')) {
                    errorMsg = err.error.detalles?.mensaje || 'Ya tienes una reserva en ese horario';

                    this.snackBar.open(errorMsg, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-warning'] // Cambiar a warning
                    });

                    // Limpiar selección para que el usuario elija otro horario
                    this.fechaSeleccionada = null;
                    this.horaSeleccionada = '';
                    this.pasoActual = 1;
                } else {
                    // Error real del sistema
                    this.snackBar.open(errorMsg, 'Cerrar', {
                        duration: 5000,
                        panelClass: ['snackbar-error']
                    });
                }

                this.cdr.detectChanges();
            }
        });
    }

    validarReservaCompleta(): boolean {
        return !!this.fechaSeleccionada &&
            !!this.horaSeleccionada &&
            !!this.servicioSeleccionado &&
            !!this.trabajadorSeleccionado;
    }

    // ====================
    // UTILITARIOS
    // ====================

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    }

    formatDateSpanish(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('es-ES', options);
    }

    getHorarioTexto(): string {
        const dias = this.configuracion.dias_apertura
            .map(dia => this.NOMBRES_DIAS_COMPLETOS[this.convertirDiaEspanolAIngles(dia)] || dia)
            .join(', ');

        return `Horario según días de apertura (${dias})`;
    }

    getCategoriaIcon(categoria: string): string {
        const iconMap: { [key: string]: string } = {
            'peluqueria': 'content_cut',
            'peluquería': 'content_cut',
            'estetica': 'spa',
            'estética': 'spa'
        };
        return iconMap[categoria.toLowerCase()] || 'spa';
    }

    // TrackBy functions
    trackByDia(index: number, dia: DiaSemana): string {
        return `${dia.fecha.getTime()}-${dia.nombre}`;
    }

    trackByHora(index: number, hora: string): string {
        return hora;
    }

    trackByServicio(index: number, servicio: Servicio): number {
        return servicio.id;
    }

    trackByTrabajador(index: number, trabajador: TrabajadorDisponible): number {
        return trabajador.id;
    }
}