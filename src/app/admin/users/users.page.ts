import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { UsersService, UserItem } from './users.service';
import { BranchesService } from '../../core/branches.service';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, MatIconModule, MatSelectModule],
  template: `
  <section class="space-y-4">
    <header class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Usuarios</h1>
      <div class="flex items-center gap-3">
        <mat-form-field appearance="outline" class="w-72">
          <mat-label>Buscar</mat-label>
          <input matInput [formControl]="q">
          <button mat-icon-button matSuffix *ngIf="q.value" (click)="q.setValue('')"><mat-icon>close</mat-icon></button>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openCreate()">Nuevo</button>
      </div>
    </header>

    <table mat-table [dataSource]="rows()">

      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let r">{{ r.email }}</td>
      </ng-container>

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nombre</th>
        <td mat-cell *matCellDef="let r">{{ r.fullName }}</td>
      </ng-container>

      <ng-container matColumnDef="sucursal">
        <th mat-header-cell *matHeaderCellDef>Sucursal</th>
        <td mat-cell *matCellDef="let r">{{ r.sucursalNombre }}</td>
      </ng-container>

      <ng-container matColumnDef="roles">
        <th mat-header-cell *matHeaderCellDef>Roles</th>
        <td mat-cell *matCellDef="let r">{{ r.roles.join(', ') }}</td>
      </ng-container>

      <ng-container matColumnDef="acciones">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let r">
          <button mat-icon-button (click)="openEdit(r)" title="Editar"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button (click)="resetPassword(r)" title="Reset password"><mat-icon>key</mat-icon></button>
          <button mat-icon-button (click)="toggleLock(r)" [title]="r.lockedOut ? 'Desbloquear' : 'Bloquear'">
            <mat-icon>{{ r.lockedOut ? 'lock_open' : 'lock' }}</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayed"></tr>
      <tr mat-row *matRowDef="let row; columns: displayed;"></tr>
    </table>

    <div *ngIf="rows().length===0" class="text-center text-gray-500 py-8">Sin usuarios.</div>
  </section>
  `
})
export class UsersPage {
  private svc = inject(UsersService);
  private dialog = inject(MatDialog);

  q = inject(FormBuilder).control<string>('', { nonNullable: true });
  rows = signal<UserItem[]>([]);
  displayed = ['email','name','sucursal','roles','acciones'];

  constructor() {
    this.q.valueChanges.subscribe(() => this.load());
    this.load();
  }

  load() {
    this.svc.list(this.q.value).subscribe(res => this.rows.set(res.items));
  }

  openCreate() {
    this.dialog.open(UserDialog, { data: null }).afterClosed().subscribe(ok => ok && this.load());
  }
  openEdit(u: UserItem) {
    this.dialog.open(UserDialog, { data: u }).afterClosed().subscribe(ok => ok && this.load());
  }
  resetPassword(u: UserItem) {
    const pass = prompt('Nueva contraseña para ' + u.email);
    if (!pass) return;
    this.svc.resetPassword(u.id, pass).subscribe(() => alert('Contraseña actualizada'));
  }
  toggleLock(u: UserItem) {
    this.svc.setLock(u.id, !u.lockedOut).subscribe(() => this.load());
  }
}

@Component({
  standalone: true,
  selector: 'app-user-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
  <h2 mat-dialog-title>{{ data ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
  <form class="p-4 space-y-4" [formGroup]="form" (ngSubmit)="save()">
    <div class="grid md:grid-cols-2 gap-4">
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" [readonly]="!!data" required>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="fullName" required>
      </mat-form-field>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
      <mat-form-field appearance="outline">
        <mat-label>Sucursal</mat-label>
        <mat-select formControlName="sucursalId" required>
          <mat-option *ngFor="let s of sucursales" [value]="s.id">{{ s.nombre }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" *ngIf="!data">
        <mat-label>Contraseña</mat-label>
        <input matInput type="password" formControlName="password" required>
      </mat-form-field>
    </div>

    <mat-form-field appearance="outline" class="w-full">
      <mat-label>Roles</mat-label>
      <mat-select formControlName="roles" multiple required>
        <mat-option *ngFor="let r of roles" [value]="r">{{ r }}</mat-option>
      </mat-select>
    </mat-form-field>

    <div class="flex justify-end gap-2">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid">Guardar</button>
    </div>
  </form>
  `
})
export class UserDialog {
  private ref = inject(MatDialogRef<UserDialog>);
  private users = inject(UsersService);
  private branches = inject(BranchesService);
  roles: string[] = [];
  sucursales: { id: string; nombre: string }[] = [];

  form = inject(FormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', Validators.required],
    sucursalId: ['', Validators.required],
    password: [''],
    roles: [[], Validators.required] as [string[], any]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: UserItem | null) {
    this.users.roles().subscribe(r => this.roles = r);
    this.branches.list().subscribe(s => this.sucursales = s);

    if (data) {
      this.form.patchValue({
        email: data.email,
        fullName: data.fullName,
        sucursalId: data.sucursalId,
        roles: data.roles
      });
      this.form.controls.password.clearValidators();
      this.form.controls.email.disable();
    } else {
      this.form.controls.password.addValidators([Validators.required, Validators.minLength(6)]);
    }
  }

  close(){ this.ref.close(false); }
  save(){
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (!this.data) {
      this.users.create({ email: v.email!, fullName: v.fullName!, sucursalId: v.sucursalId!, password: v.password!, roles: v.roles! })
        .subscribe({ next: _ => this.ref.close(true) });
    } else {
      this.users.update(this.data.id, { fullName: v.fullName!, sucursalId: v.sucursalId!, roles: v.roles! })
        .subscribe({ next: _ => this.ref.close(true) });
    }
  }
}
