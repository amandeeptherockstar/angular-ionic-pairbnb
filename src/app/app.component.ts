import { Component, OnInit, OnDestroy } from '@angular/core';

import { Platform } from '@ionic/angular';
import { Plugins, Capacitor, StatusBarStyle, AppState } from '@capacitor/core';
// import { SplashScreen } from '@ionic-native/splash-screen/ngx';
// import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  isAuthSubscription: Subscription;
  private previousAuthState = false;

  constructor(
    private platform: Platform,
    // private splashScreen: SplashScreen,
    // private statusBar: StatusBar,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    // we will navigate to /auth whenever user Auth state changes and isAuth is false
    this.isAuthSubscription = this.authService.userIsAuthenticated.subscribe(
      isAuth => {
        if (!isAuth && this.previousAuthState !== isAuth) {
          // && this.previousAuthState !== isAuth
          this.router.navigateByUrl('/auth');
        }
        this.previousAuthState = isAuth;
      }
    );

    // for app runnning on background
    //   if (Capacitor.isPluginAvailable('App')) {
    //     Plugins.App.addListener(
    //       'appStateChange',
    //       this.checkAuthOnResume.bind(this)
    //     );

    //     // for back button (android only)
    //     Plugins.App.addListener('backButton', () => this.backButtonListener);
    //   }
    // }

    // checkAuthOnResume(state: AppState) {
    //   if (state.isActive) {
    //     this.authService
    //       .autoLogin()
    //       .pipe(take(1))
    //       .subscribe(success => {
    //         if (!success) {
    //           this.authService.logout();
    //         }
    //       });
    //   }
  }

  backButtonListener() {
    Plugins.App.exitApp();
  }

  ngOnDestroy() {
    if (this.isAuthSubscription) {
      this.isAuthSubscription.unsubscribe();
    }
    // remove checkAuthOnResume Listener
    // Plugins.App.removeListener('appStateChange', this.checkAuthOnResume);
    // // remove back button listener
    // Plugins.App.removeListener('backButton', this.backButtonListener);
  }

  // ionViewDidEnter() {
  //   this.subscription = this.platform.backButton.subscribe(() => {
  //     navigator['app'].exitApp();
  //   });
  // }
  // ionViewWillLeave() {
  //   this.subscription.unsubscribe();
  // }

  initializeApp() {
    this.platform.ready().then(() => {
      if (Capacitor.isPluginAvailable('SplashScreen')) {
        Plugins.SplashScreen.hide();
      }

      if (Capacitor.isPluginAvailable('StatusBar')) {
        // Light text for dark backgrounds.
        //  Dark: "DARK"
        // Dark text for light backgrounds.
        // Light: "LIGHT"
        Plugins.StatusBar.setStyle({
          style: StatusBarStyle.Light
        });

        Plugins.StatusBar.setBackgroundColor({
          color: '#f4f5f8'
        });
      }
      // this.statusBar.styleDefault();
      // this.splashScreen.hide();
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/auth');
  }
}
