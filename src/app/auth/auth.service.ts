import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { FirebaseAuthResponse } from './user.interface';
import { BehaviorSubject, from } from 'rxjs';
import { User } from './user.model';
import { map, tap } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;

  constructor(private http: HttpClient) {}

  get userIsAuthenticated() {
    // if the user has token then return true otherwise false
    return this._user.asObservable().pipe(
      map(user => {
        console.log(user, ' USER IS AUTHENTICATED');
        if (user) {
          // if user.token is null -> !!user.token will return false, otherwise true
          return !!user.token;
        }
        return false;
      })
    );
  }

  get userId() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.userId;
        }
        return null;
      })
    );
  }

  get token() {
    return this._user.asObservable().pipe(
      map(user => {
        if (user) {
          return user.token;
        }
        return null;
      })
    );
  }

  autoLogin() {
    // from is used to convert a promise into observable
    return from(Plugins.Storage.get({ key: 'authData' })).pipe(
      map(storeData => {
        if (!storeData || !storeData.value) {
          return null;
        }
        const parsedData = JSON.parse(storeData.value) as {
          userId: string;
          email: string;
          token: string;
          tokenExpiryTime: string;
        };

        const tokenExpiryDate = new Date(parsedData.tokenExpiryTime);
        if (tokenExpiryDate <= new Date()) {
          // if the token is expired we return null
          return null;
        }

        const user = new User(
          parsedData.userId,
          parsedData.email,
          parsedData.token,
          new Date(tokenExpiryDate)
        );
        return user;
      }),
      tap(user => {
        if (user) {
          this._user.next(user);

          // call the autologout
          this.autoLogout(user.remainingTimeForTokenExpire);
        }
      }),
      map((user: User) => {
        // return true or false, depending upon if the user is there or not
        console.log(!!user + ' USER');
        return !!user;
      })
    );
  }

  // when will we call autoLogout? Ans - Whenever we log in, auto login and register, that will start the timer to logout
  autoLogout(duration: number) {
    // clear the old timer before setting a new one
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }

    // this.activeLogoutTimer = setTimeout(() => {
    //   this.logout();
    // }, duration);
  }

  register(email: string, password: string) {
    return this.http
      .post<FirebaseAuthResponse>(
        `https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=${
          environment.firebaseApiKey
        }`,
        { email, password, returnSecureToken: true }
      )
      .pipe(tap(this.setUserDataAndEmitUserEvent.bind(this)));
  }

  login(email: string, password: string) {
    return this.http
      .post<FirebaseAuthResponse>(
        `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=${
          environment.firebaseApiKey
        }`,
        {
          email,
          password,
          returnSecureToken: true
        }
      )
      .pipe(tap(this.setUserDataAndEmitUserEvent.bind(this)));

    // this._userIsAuthenticated = true;
  }

  logout() {
    console.log('logout called');
    // clear the old timer before logging out
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }

    this._user.next(null);
    Plugins.Storage.remove({
      key: 'authData'
    });
  }

  ngOnDestroy() {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
  }

  private setUserDataAndEmitUserEvent(firebaseResponse: FirebaseAuthResponse) {
    // +firebaseResponse.expiresIn gives us seconds ie 3600 default, so multiply it to 1000 to convert them to milliseconds
    const expirationDate = new Date(
      new Date().getTime() + +firebaseResponse.expiresIn * 1000
    );
    const user = new User(
      firebaseResponse.localId,
      firebaseResponse.email,
      firebaseResponse.idToken,
      expirationDate
    );
    this._user.next(user);

    // set auto logout
    this.autoLogout(user.remainingTimeForTokenExpire);

    this.storeAuthDataParmanently(
      firebaseResponse.localId,
      firebaseResponse.email,
      firebaseResponse.idToken,
      expirationDate.toISOString()
    );
  }

  private storeAuthDataParmanently(
    userId: string,
    email: string,
    token: string,
    tokenExpiryTime: string
  ) {
    const data = { userId, email, token, tokenExpiryTime };
    Plugins.Storage.set({
      key: 'authData',
      value: JSON.stringify(data)
    });
  }
}
