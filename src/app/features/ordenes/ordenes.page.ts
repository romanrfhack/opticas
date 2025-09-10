import { Component } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-ordenes',
  imports: [],
  template: `
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Órdenes</h1>
    </header>
    <div class="card p-6">
      <p class="text-gray-600">Creación de órdenes, avances y cobros.</p>
      <p class="mt-2 text-sm text-gray-500">Empieza aquí la funcionalidad de <strong>Órdenes</strong>.</p>
    </div>
  </section>
  `
})
export class OrdenesPage { }
