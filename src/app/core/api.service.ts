import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly urlBase = environment.urlDaApi;

  constructor(protected readonly http: HttpClient) {}
}
