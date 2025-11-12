import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

export interface ReservaDetallesData {
  reserva: any;
  esVistaTrabajador?: boolean;
  usuarioActual?: any;
  contexto?: 'calendario-general' | 'mi-agenda' | 'mis-reservas';
}

@Component({
  selector: 'app-reserva-detalles-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule
  ],
  providers: [DatePipe],
  templateUrl: './reserva-detalles-modal.component.html',
  styleUrls: ['./reserva-detalles-modal.component.scss']
})
export class ReservaDetallesModalComponent implements OnInit {
  usuario: any;
  rolReal: string = '';
  esVistaTrabajador: boolean = false;
  contexto: string = 'calendario-general';

  // Permisos para acciones
  puedeAceptarReserva: boolean = false;
  puedeCancelarReserva: boolean = false;
  puedeEditarReserva: boolean = false;
  esModoSoloLectura: boolean = true;

  // Información específica para clientes
  puedeCancelarComoCliente: boolean = false;
  mostrarInformacionCliente: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ReservaDetallesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReservaDetallesData,
    private datePipe: DatePipe
  ) { }

  ngOnInit() {
    console.log('🔍 DATOS COMPLETOS DE LA RESERVA EN MODAL:', JSON.stringify(this.data.reserva, null, 2));
    this.cargarUsuarioYVista();
    this.verificarPermisos();
  }

  cargarUsuarioYVista() {
    if (this.data.usuarioActual) {
      this.usuario = this.data.usuarioActual;
    } else {
      const usuarioStr = localStorage.getItem('usuario');
      this.usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
    }

    this.esVistaTrabajador = this.data.esVistaTrabajador || false;
    this.rolReal = this.usuario?.rol || '';
    this.contexto = this.data.contexto || 'calendario-general';

    console.log('👤 Contexto del modal:', {
      usuario: this.usuario,
      rolReal: this.rolReal,
      esVistaTrabajador: this.esVistaTrabajador,
      contexto: this.contexto
    });
  }

  // === MÉTODOS ROBUSTOS PARA DATOS ===

  getNombreCliente(): string {
    const reserva = this.data.reserva;

    // Formato anidado (endpoint trabajadores)
    if (reserva.cliente && reserva.cliente.nombre) {
      return `${reserva.cliente.nombre} ${reserva.cliente.apellidos || ''}`.trim();
    }

    // Formato plano (endpoint calendario general)
    if (reserva.cliente_nombre && reserva.cliente_apellidos) {
      return `${reserva.cliente_nombre} ${reserva.cliente_apellidos}`;
    }

    // Por ID
    if (reserva.cliente_id) {
      return `Cliente #${reserva.cliente_id}`;
    }

    return 'Cliente no disponible';
  }

  getNombreTrabajador(): string {
    const reserva = this.data.reserva;

    // PRIORIDAD 1: Objeto trabajador completo con nombre y apellidos
    if (reserva.trabajador && reserva.trabajador.nombre && reserva.trabajador.apellidos) {
      const nombreCompleto = `${reserva.trabajador.nombre} ${reserva.trabajador.apellidos}`.trim();
      return nombreCompleto;
    }

    // PRIORIDAD 2: Campos planos del JOIN (formato calendario general)
    if (reserva.trabajador_nombre && reserva.trabajador_apellidos) {
      return `${reserva.trabajador_nombre} ${reserva.trabajador_apellidos}`;
    }

    // PRIORIDAD 3: Solo tenemos el ID
    if (reserva.trabajador_id) {
      return `Trabajador #${reserva.trabajador_id}`;
    }

    return 'Sin asignar';
  }

  getPrecioServicio(): number {
    const reserva = this.data.reserva;

    // Todas las ubicaciones posibles del precio (de mayor a menor prioridad)
    const posiblesPrecios = [
      reserva.precio,
      reserva.servicio_precio,
      reserva.servicio?.precio,
      reserva.precio_total
    ];

    for (const precio of posiblesPrecios) {
      if (precio !== undefined && precio !== null && precio !== '' && !isNaN(parseFloat(precio))) {
        return parseFloat(precio);
      }
    }

    return 0;
  }

  getEspecialidadesTrabajador(): string {
    const reserva = this.data.reserva;

    if (reserva.trabajador && reserva.trabajador.especialidades) {
      if (Array.isArray(reserva.trabajador.especialidades)) {
        return reserva.trabajador.especialidades.join(', ');
      } else if (typeof reserva.trabajador.especialidades === 'string') {
        return reserva.trabajador.especialidades;
      }
    }

    return 'No especificadas';
  }

  getFechaCreacion(): string {
    const reserva = this.data.reserva;
    return reserva.fecha_creacion || new Date().toISOString();
  }

  getPoliticaCancelacion(): string {
    const reserva = this.data.reserva;
    return reserva.politica_cancelacion || 'flexible';
  }

  getNotasInternas(): string {
    const reserva = this.data.reserva;
    return reserva.notas_internas || '';
  }

  getNombreServicio(): string {
    const reserva = this.data.reserva;

    // Formato anidado (endpoint trabajadores)
    if (reserva.servicio && reserva.servicio.nombre) {
      return reserva.servicio.nombre;
    }

    // Formato plano (endpoint calendario general)
    if (reserva.servicio_nombre) {
      return reserva.servicio_nombre;
    }

    return 'Servicio no disponible';
  }

  getDuracionServicio(): number {
    const reserva = this.data.reserva;

    // Formato anidado (endpoint trabajadores)
    if (reserva.servicio && reserva.servicio.duracion !== undefined) {
      return reserva.servicio.duracion;
    }

    // Formato plano (endpoint calendario general)
    if (reserva.servicio_duracion !== undefined) {
      return reserva.servicio_duracion;
    }

    // Duración directa
    if (reserva.duracion !== undefined) {
      return reserva.duracion;
    }

    return 0;
  }

  // === MÉTODOS DE FORMATO ===

  formatTime(timeString: string): string {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  }

  formatCurrency(amount: any): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(numAmount || 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    return this.datePipe.transform(dateString, 'fullDate') || dateString;
  }

  formatDateTime(dateTimeString: string): string {
    if (!dateTimeString) return 'Fecha no disponible';
    return this.datePipe.transform(dateTimeString, 'medium') || dateTimeString;
  }

  // === PERMISOS Y ACCIONES - MODIFICADO PARA CLIENTES ===

  getVistaEfectiva(): string {
    if (this.rolReal === 'administrador' && this.esVistaTrabajador) {
      return 'trabajador';
    }
    return this.rolReal;
  }

  verificarPermisos() {
    if (!this.usuario) return;

    const reserva = this.data.reserva;
    const vistaEfectiva = this.getVistaEfectiva();

    console.log('🔐 Verificando permisos en contexto:', this.contexto);

    // Resetear permisos
    this.esModoSoloLectura = true;
    this.puedeAceptarReserva = false;
    this.puedeCancelarReserva = false;
    this.puedeEditarReserva = false;
    this.puedeCancelarComoCliente = false;
    this.mostrarInformacionCliente = false;

    // === PERMISOS PARA CLIENTES ===
    if (vistaEfectiva === 'cliente') {
      this.mostrarInformacionCliente = true;

      // El cliente puede cancelar sus propias reservas si están pendientes o confirmadas
      // y la fecha de la reserva es futura
      if (reserva.cliente_id === this.usuario.id) {
        const ahora = new Date();
        const fechaReserva = new Date(reserva.fecha_reserva + 'T' + reserva.hora_inicio);
        const esFutura = fechaReserva > ahora;

        this.puedeCancelarComoCliente = (reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && esFutura;
        this.esModoSoloLectura = !this.puedeCancelarComoCliente;
      }
      return;
    }

    // === PERMISOS ORIGINALES PARA TRABAJADORES/ADMIN ===
    if (this.contexto === 'calendario-general') {
      // Vista solo lectura para calendario general
      return;
    }

    if (this.contexto === 'mi-agenda' && vistaEfectiva === 'trabajador') {
      this.puedeAceptarReserva = reserva.trabajador_id === this.usuario.id &&
        reserva.estado === 'pendiente';
      this.esModoSoloLectura = !this.puedeAceptarReserva;
    }

    if (this.contexto === 'mis-reservas' && vistaEfectiva === 'cliente') {
      this.puedeCancelarReserva = reserva.cliente_id === this.usuario.id;
      this.esModoSoloLectura = !this.puedeCancelarReserva;
    }

    console.log('🎯 Permisos finales:', {
      soloLectura: this.esModoSoloLectura,
      puedeAceptar: this.puedeAceptarReserva,
      puedeCancelar: this.puedeCancelarReserva,
      puedeEditar: this.puedeEditarReserva,
      puedeCancelarComoCliente: this.puedeCancelarComoCliente
    });
  }

  aceptarReserva() {
    if (!this.puedeAceptarReserva) {
      console.warn('❌ No tienes permisos para aceptar esta reserva');
      return;
    }
    this.dialogRef.close({
      accion: 'aceptada',
      reserva: this.data.reserva
    });
  }

  cancelarReserva() {
    // Manejar tanto la cancelación de trabajadores como de clientes
    if (!this.puedeCancelarReserva && !this.puedeCancelarComoCliente) {
      console.warn('❌ No tienes permisos para cancelar esta reserva');
      return;
    }
    this.dialogRef.close({
      accion: 'cancelada',
      reserva: this.data.reserva
    });
  }

  editarReserva() {
    if (!this.puedeEditarReserva) {
      console.warn('❌ No tienes permisos para editar esta reserva');
      return;
    }
    this.dialogRef.close({
      accion: 'editar',
      reserva: this.data.reserva
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  getBadgeText(): string {
    const vistaEfectiva = this.getVistaEfectiva();

    if (vistaEfectiva === 'cliente') {
      return 'Mi Reserva';
    } else if (this.contexto === 'calendario-general') {
      return 'Vista Solo Lectura';
    } else if (this.rolReal === 'administrador' && this.esVistaTrabajador) {
      return 'Admin (Vista Trabajador)';
    } else if (this.rolReal === 'administrador') {
      return 'Vista Administrador';
    } else if (vistaEfectiva === 'trabajador') {
      return 'Vista Trabajador';
    } else {
      return `Vista ${vistaEfectiva.charAt(0).toUpperCase() + vistaEfectiva.slice(1)}`;
    }
  }

  getBadgeClass(): string {
    const vistaEfectiva = this.getVistaEfectiva();

    if (vistaEfectiva === 'cliente') {
      return 'badge-client';
    } else if (this.contexto === 'calendario-general') {
      return 'badge-readonly';
    } else if (this.rolReal === 'administrador' && this.esVistaTrabajador) {
      return 'badge-admin-worker';
    } else if (this.rolReal === 'administrador') {
      return 'badge-admin';
    } else if (vistaEfectiva === 'trabajador') {
      return 'badge-worker';
    } else {
      return 'badge-client';
    }
  }

  // === MÉTODOS ESPECÍFICOS PARA CLIENTES ===

  getDescripcionPoliticaCancelacion(): string {
    const politica = this.getPoliticaCancelacion();
    switch (politica) {
      case 'flexible':
        return 'Cancelación gratuita hasta 24 horas antes';
      case 'moderada':
        return '25% de penalización si se cancela con menos de 48 horas';
      case 'estricta':
        return '50% de penalización si se cancela con menos de 72 horas';
      default:
        return 'Política de cancelación estándar';
    }
  }

  esReservaCancelable(): boolean {
    if (!this.data.reserva.fecha_reserva || !this.data.reserva.hora_inicio) {
      return false;
    }

    const ahora = new Date();
    const fechaReserva = new Date(this.data.reserva.fecha_reserva + 'T' + this.data.reserva.hora_inicio);
    return fechaReserva > ahora;
  }

  // Método auxiliar para iconos de estado
  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'confirmada':
        return 'check_circle';
      case 'pendiente':
        return 'schedule';
      case 'cancelada':
        return 'cancel';
      case 'completada':
        return 'done_all';
      default:
        return 'help';
    }
  }

}