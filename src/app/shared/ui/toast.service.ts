import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class Toast {
  private snack = inject(MatSnackBar);
  ok(msg: string) { this.snack.open(msg, 'OK', { duration: 2500 }); }
  err(msg: string) { this.snack.open(msg, 'Error', { duration: 3500, panelClass: ['mat-warn'] }); }
}
