import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  CrearHistoriaRequest, EnviarLabRequest, PacienteLite, UltimaHistoriaItem
} from './models/clinica.models';
import { VisitaDetalle } from '../clinica/visita-detalle.component';

@Injectable({ providedIn: 'root' })
export class HistoriasService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  create(req: CrearHistoriaRequest) {
    return this.http.post<{ id: string }>(`${this.base}/historias`, req);
  }

  detalle(id: string) {
  return this.http.get<VisitaDetalle>(`${this.base}/visitas/${id}`);
}

  getById(id: string) {
    return this.http.get<any>(`${this.base}/historias/${id}`);
  }

  ultimas(pacienteId: string, take = 5) {
    console.log("Fetching ultimas historias for pacienteId:", pacienteId, " with take:", take);
    return this.http.get<UltimaHistoriaItem[]>(`${this.base}/historias/ultimas/${pacienteId}`, { params: { take } as any });
  }

  enviarALab(id: string, req: EnviarLabRequest) {
    return this.http.post<void>(`${this.base}/historias/${id}/enviar-lab`, req);
  }

  enLaboratorio(take = 100) {
    return this.http.get<any[]>(`${this.base}/historias/en-laboratorio`, { params: { take } as any });
  }  

  pacientesHeader(ids: string[]) {
    if (!ids || ids.length === 0) {
      return Promise.resolve([] as PacienteLite[]);
    }
    return this.http.post<PacienteLite[]>(`${this.base}/pacientes/lite-batch`, { ids }).toPromise();    
  }

  // historial(pacienteId:string, q:{page:number; pageSize:number; estado?:string; from?:string; to?:string; soloPendientes?:boolean}) {
  //   const params = new URLSearchParams({
  //     page: String(q.page), pageSize: String(q.pageSize),
  //     ...(q.estado ? { estado: q.estado } : {}),
  //     ...(q.from ? { from: q.from } : {}),
  //     ...(q.to ? { to: q.to } : {}),
  //     ...(q.soloPendientes ? { soloPendientes: 'true' } : {})
  //   });
  //   return fetch(`${this.baseUrl}/pacientes/${pacienteId}/historial?${params.toString()}`, {credentials:'include'})
  //     .then(r => r.json() as Promise<PagedResult<VisitaRow>>);
  // }

  historial(pacienteId: string, page: number, pageSize: number, estado?: string, from?: string, to?: string, soloPendientes?: boolean) {
    let params: any = { page: String(page), pageSize: String(pageSize) };
    if (estado) params.estado = estado;
    if (from) params.from = from;
    if (to) params.to = to;
    if (soloPendientes) params.soloPendientes = 'true';

    return this.http.get<{ page: number; pageSize: number; total: number; items: any[] }>(
      `${this.base}/pacientes/${pacienteId}/historial`, { params }
    ).toPromise();  
  }
}