import { Injectable } from '@angular/core';
import { Route, UrlSegment, CanLoad, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { take, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanLoad {
  constructor(private authService: AuthService, private router: Router) {}
  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.userIsAuthenticated.pipe(
      take(1),
      // try to auto-login first
      switchMap((isAuthenticated: boolean) => {
        console.log(isAuthenticated, 'ISAUTH');
        if (!isAuthenticated) {
          // if the user is not authenticated, try autologin
          return this.authService.autoLogin();
        }
        // return isAuthenticated (as true), if user is already authenticated
        return of(isAuthenticated);
      }),
      tap((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          // if user is not authenticated return him to auth page
          this.router.navigateByUrl('/auth');
        }
      })
    );
  }
}
