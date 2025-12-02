import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
    MatChipsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
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
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
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
  }

  // === MÉTODOS ROBUSTOS PARA DATOS ===

  getNombreCliente(): string {
    const reserva = this.data.reserva;

    if (reserva.cliente && reserva.cliente.nombre) {
      return `${reserva.cliente.nombre} ${reserva.cliente.apellidos || ''}`.trim();
    }

    if (reserva.cliente_nombre && reserva.cliente_apellidos) {
      return `${reserva.cliente_nombre} ${reserva.cliente_apellidos}`;
    }

    if (reserva.cliente_id) {
      return `Cliente #${reserva.cliente_id}`;
    }

    return 'Cliente no disponible';
  }

  getNombreTrabajador(): string {
    const reserva = this.data.reserva;

    if (reserva.trabajador && reserva.trabajador.nombre && reserva.trabajador.apellidos) {
      const nombreCompleto = `${reserva.trabajador.nombre} ${reserva.trabajador.apellidos}`.trim();
      return nombreCompleto;
    }

    if (reserva.trabajador_nombre && reserva.trabajador_apellidos) {
      return `${reserva.trabajador_nombre} ${reserva.trabajador_apellidos}`;
    }

    if (reserva.trabajador_id) {
      return `Trabajador #${reserva.trabajador_id}`;
    }

    return 'Sin asignar';
  }

  getPrecioServicio(): number {
    const reserva = this.data.reserva;

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
    return 'flexible';
  }

  getNotasInternas(): string {
    const reserva = this.data.reserva;
    return reserva.notas_internas || '';
  }

  getNombreServicio(): string {
    const reserva = this.data.reserva;

    if (reserva.servicio && reserva.servicio.nombre) {
      return reserva.servicio.nombre;
    }

    if (reserva.servicio_nombre) {
      return reserva.servicio_nombre;
    }

    return 'Servicio no disponible';
  }

  getDuracionServicio(): number {
    const reserva = this.data.reserva;

    if (reserva.servicio && reserva.servicio.duracion !== undefined) {
      return reserva.servicio.duracion;
    }

    if (reserva.servicio_duracion !== undefined) {
      return reserva.servicio_duracion;
    }

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

  // === PERMISOS Y ACCIONES ===

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

      if (reserva.cliente_id === this.usuario.id) {
        const ahora = new Date();
        const fechaReserva = new Date(reserva.fecha_reserva + 'T' + reserva.hora_inicio);
        const esFutura = fechaReserva > ahora;

        // ✅ CORRECCIÓN: No permitir cancelar reservas rechazadas
        this.puedeCancelarComoCliente =
          (reserva.estado === 'pendiente' || reserva.estado === 'confirmada') &&
          esFutura &&
          reserva.estado !== 'rechazada'; // ✅ Nueva condición

        this.esModoSoloLectura = !this.puedeCancelarComoCliente;
      }
      return;
    }
    // === PERMISOS ORIGINALES PARA TRABAJADORES/ADMIN ===
    if (this.contexto === 'calendario-general') {
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

  // CORREGIDO: Cancelación directa sin abrir otro diálogo
  cancelarReserva() {
    if (!this.puedeCancelarReserva && !this.puedeCancelarComoCliente) {
      console.warn('❌ No tienes permisos para cancelar esta reserva');
      return;
    }

    // Abrir diálogo de cancelación directo
    const dialogRef = this.dialog.open(DialogoCancelacionSimpleComponent, {
      width: '400px',
      data: {
        reserva: this.data.reserva
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Usar la política de la reserva - CORREGIDO: cliente no elige política
        const politica = this.data.reserva.politica_cancelacion || 'flexible';

        // Cerrar el modal con todos los datos necesarios
        this.dialogRef.close({
          accion: 'cancelada',
          reserva: this.data.reserva,
          motivo: result.motivo,
          politica: politica
        });
      }
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
    return 'Sistema de políticas de cancelación en desarrollo. Próximamente disponible.';
  }

  esReservaCancelable(): boolean {
    if (!this.data.reserva.fecha_reserva || !this.data.reserva.hora_inicio) {
      return false;
    }

    const ahora = new Date();
    const fechaReserva = new Date(this.data.reserva.fecha_reserva + 'T' + this.data.reserva.hora_inicio);

    // ✅ CORRECCIÓN: No es cancelable si ya pasó o si está rechazada
    return fechaReserva > ahora && this.data.reserva.estado !== 'rechazada';
  }

  // Método auxiliar para iconos de estado
  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'confirmada': return 'check_circle';
      case 'pendiente': return 'schedule';
      case 'cancelada': return 'cancel';
      case 'completada': return 'done_all';
      case 'rechazada': return 'block';
      default: return 'help';
    }
  }

  // Método para obtener el motivo del rechazo
  getMotivoRechazo(): string {
    const reserva = this.data.reserva;

    // Primero intentar obtener del motivo_cancelacion
    if (reserva.motivo_cancelacion && reserva.estado === 'rechazada') {
      return reserva.motivo_cancelacion;
    }

    // Si no, buscar en las notas internas
    if (reserva.notas_internas) {
      const lineas = reserva.notas_internas.split('\n');
      const lineaRechazo = lineas.find((linea: string | string[]) =>
        linea.includes('RECHAZADA POR TRABAJADOR') ||
        linea.includes('Rechazada por trabajador')
      );
      if (lineaRechazo) {
        // Extraer solo el motivo, quitando el prefijo
        return lineaRechazo.replace(/RECHAZADA POR TRABAJADOR.*?:/, '')
          .replace(/Rechazada por trabajador.*?:/, '')
          .trim();
      }
    }

    return 'Motivo no especificado';
  }

  // Método para verificar si es una reserva rechazada
  esReservaRechazada(): boolean {
    return this.data.reserva.estado === 'rechazada';
  }

  // === NUEVOS MÉTODOS PARA CANCELACIONES - CORREGIDOS ===

  // Método para verificar si es una reserva cancelada
  esReservaCancelada(): boolean {
    return this.data.reserva.estado === 'cancelada';
  }

  // Método CORREGIDO para obtener el motivo de cancelación
  getMotivoCancelacion(): string {
    const reserva = this.data.reserva;

    console.log('🔍 Buscando motivo de cancelación para reserva:', {
      id: reserva.id,
      estado: reserva.estado,
      motivo_cancelacion: reserva.motivo_cancelacion,
      notas_internas: reserva.notas_internas,
      notas: reserva.notas
    });

    // 1. Primero intentar obtener directamente del campo motivo_cancelacion
    if (reserva.motivo_cancelacion) {
      console.log('✅ Motivo encontrado en motivo_cancelacion:', reserva.motivo_cancelacion);
      return reserva.motivo_cancelacion;
    }

    // 2. Buscar en notas_internas por patrones de cancelación
    if (reserva.notas_internas) {
      console.log('🔍 Buscando en notas_internas:', reserva.notas_internas);

      const lineas = reserva.notas_internas.split('\n');

      // Buscar líneas que contengan información de cancelación
      for (const linea of lineas) {
        const lineaLower = linea.toLowerCase();

        // Patrones para cancelación
        if (lineaLower.includes('cancelada') ||
          lineaLower.includes('cancelación') ||
          lineaLower.includes('cancelar') ||
          lineaLower.includes('cancelado')) {

          console.log('✅ Línea de cancelación encontrada:', linea);

          // Extraer solo el motivo (eliminar prefijos comunes)
          let motivo = linea
            .replace(/.*cancelada.*?:/i, '')
            .replace(/.*cancelación.*?:/i, '')
            .replace(/.*cancelar.*?:/i, '')
            .replace(/.*cancelado.*?:/i, '')
            .trim();

          // Si después de limpiar queda vacío, usar la línea completa
          if (motivo && motivo.length > 0) {
            return motivo;
          } else {
            return linea.trim();
          }
        }
      }
    }

    // 3. Buscar en notas normales
    if (reserva.notas) {
      console.log('🔍 Buscando en notas:', reserva.notas);
      const lineas = reserva.notas.split('\n');

      for (const linea of lineas) {
        const lineaLower = linea.toLowerCase();
        if (lineaLower.includes('cancel') || lineaLower.includes('cancelar')) {
          console.log('✅ Motivo encontrado en notas:', linea);
          return linea.trim();
        }
      }
    }

    // 4. Si no se encuentra en ningún campo, verificar si hay información en otros campos
    if (reserva.penalizacion_aplicada && reserva.penalizacion_aplicada > 0) {
      console.log('ℹ️ Penalización aplicada pero sin motivo específico');
      return 'Cancelación con penalización aplicada';
    }

    console.log('❌ No se encontró motivo de cancelación en ningún campo');
    return 'Motivo no especificado en el sistema';
  }

  // Método para obtener la fecha de cancelación
  getFechaCancelacion(): string {
    const reserva = this.data.reserva;
    if (reserva.fecha_cancelacion) {
      return this.formatDateTime(reserva.fecha_cancelacion);
    }

    // Si no hay fecha_cancelacion, buscar en notas_internas
    if (reserva.notas_internas) {
      const lineas = reserva.notas_internas.split('\n');
      for (const linea of lineas) {
        if (linea.includes('fecha') && linea.includes('cancel')) {
          return linea;
        }
      }
    }

    return 'Fecha no registrada';
  }

  // Método para obtener la política de cancelación aplicada
  getPoliticaCancelacionAplicada(): string {
    return 'Funcionalidad en desarrollo';
  }

  // Método para obtener la penalización aplicada
  getPenalizacionAplicada(): string {
    return 'Próximamente';
  }
}

// Componente de diálogo simple para cancelación (solo motivo)
@Component({
  selector: 'app-dialogo-cancelacion-simple',
  template: `
    <div class="dialogo-cancelacion-simple">
        <h2 mat-dialog-title>Cancelar Reserva</h2>
        
        <mat-dialog-content>
            <p>¿Estás seguro de que deseas cancelar esta reserva?</p>
            
            <div class="info-reserva">
                <strong>{{ data.reserva.servicio_nombre }}</strong><br>
                {{ formatDate(data.reserva.fecha_reserva) }} a las {{ formatTime(data.reserva.hora_inicio) }}
            </div>

            <form [formGroup]="cancelacionForm">
                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Motivo de cancelación</mat-label>
                    <textarea matInput formControlName="motivo" placeholder="Ingresa el motivo de la cancelación" rows="3"></textarea>
                    <mat-error *ngIf="cancelacionForm.get('motivo')?.hasError('required')">
                        El motivo es obligatorio
                    </mat-error>
                </mat-form-field>

                <div class="politica-info" *ngIf="getPoliticaCancelacion()">
                    <mat-icon>info</mat-icon>
                    <span>{{ getPoliticaCancelacion() }}</span>
                </div>
            </form>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button mat-button (click)="cancelar()">No Cancelar</button>
            <button mat-raised-button color="warn" (click)="confirmar()" [disabled]="!cancelacionForm.valid">
                <mat-icon>cancel</mat-icon>
                Confirmar Cancelación
            </button>
        </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialogo-cancelacion-simple {
        padding: 0;
    }
    .full-width {
        width: 100%;
        margin-bottom: 16px;
    }
    .info-reserva {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 16px;
        text-align: center;
    }
    .politica-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #e3f2fd;
        border-radius: 4px;
        color: #1976d2;
        font-size: 14px;
        
        mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
        }
    }
  `],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule]
})
export class DialogoCancelacionSimpleComponent {
  cancelacionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DialogoCancelacionSimpleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.cancelacionForm = this.fb.group({
      motivo: ['', Validators.required]
    });
  }

  confirmar() {
    if (this.cancelacionForm.valid) {
      this.dialogRef.close(this.cancelacionForm.value);
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  getPoliticaCancelacion(): string {
    const reserva = this.data.reserva;
    const politica = reserva.politica_cancelacion || 'flexible';

    switch (politica) {
      case 'flexible':
        return 'Política flexible: Cancelación gratuita hasta 24 horas antes';
      case 'moderada':
        return 'Política moderada: 25% de penalización si se cancela con menos de 48 horas';
      case 'estricta':
        return 'Política estricta: 50% de penalización si se cancela con menos de 72 horas';
      default:
        return 'Política de cancelación estándar';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  }
}