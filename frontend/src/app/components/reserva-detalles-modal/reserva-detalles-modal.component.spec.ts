import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservaDetallesModalComponent } from './reserva-detalles-modal.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';

describe('ReservaDetallesModalComponent', () => {
  let component: ReservaDetallesModalComponent;
  let fixture: ComponentFixture<ReservaDetallesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservaDetallesModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { reserva: {} } },
        DatePipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservaDetallesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});