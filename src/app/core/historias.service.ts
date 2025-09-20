import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  CrearHistoriaRequest, EnviarLabRequest, UltimaHistoriaItem
} from './models/clinica.models';

@Injectable({ providedIn: 'root' })
export class HistoriasService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  crear(req: CrearHistoriaRequest) {
    return this.http.post<{ id: string }>(`${this.base}/historias`, req);
  }

  getById(id: string) {
    return this.http.get<any>(`${this.base}/historias/${id}`);
  }

  ultimas(pacienteId: string, take = 5) {
    return this.http.get<UltimaHistoriaItem[]>(`${this.base}/historias/ultimas/${pacienteId}`, { params: { take } as any });
  }

  enviarALab(id: string, req: EnviarLabRequest) {
    return this.http.post<void>(`${this.base}/historias/${id}/enviar-lab`, req);
  }

  enLaboratorio(take = 100) {
    return this.http.get<any[]>(`${this.base}/historias/en-laboratorio`, { params: { take } as any });
  }
}
