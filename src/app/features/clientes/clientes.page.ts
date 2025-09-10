import { Component } from '@angular/core';


@Component({
  standalone: true,
  selector: 'app-clientes',
  imports: [],
  template: `
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Clientes</h1>
    </header>
    <div class="card p-6">
      <p class="text-gray-600">Alta y gestión de clientes, búsqueda y acciones rápidas.</p>
      <p class="mt-2 text-sm text-gray-500">Empieza aquí la funcionalidad de <strong>Clientes</strong>.</p>
    </div>
  </section>
  `
})
export class ClientesPage { }
