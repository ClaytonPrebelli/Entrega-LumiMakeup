import { Routes } from '@angular/router';
import { entregaGuard } from './core/entrega.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'pedidos', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
    title: 'Entrar — Entrega Lumi Makeup'
  },
  {
    path: 'pedidos',
    canActivate: [entregaGuard],
    loadComponent: () => import('./features/pedidos/pedidos.component').then(m => m.PedidosComponent),
    title: 'Pedidos — Entrega Lumi Makeup'
  },
  {
    path: 'relatorios',
    canActivate: [entregaGuard],
    loadComponent: () => import('./features/relatorios/relatorios.component').then(m => m.RelatoriosComponent),
    title: 'Relatórios — Entrega Lumi Makeup'
  },
  { path: '**', redirectTo: 'pedidos' }
];
