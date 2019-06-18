import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { FirebaseAuthResponse } from './user.interface';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss']
})
export class AuthPage implements OnInit {
  loginMode = true;
  @ViewChild('form') f: NgForm;
  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}

  changeLoginMode() {
    this.loginMode = !this.loginMode;
    this.f.resetForm();
  }

  authenticate(email: string, password: string) {
    let ctrl: HTMLIonLoadingElement;
    this.loadingCtrl
      .create({
        keyboardClose: true,
        spinner: 'crescent',
        message: 'Logging In'
      })
      .then((controller: HTMLIonLoadingElement) => {
        ctrl = controller;
        controller.present();
        let observable: Observable<FirebaseAuthResponse>;
        if (this.loginMode) {
          // login request
          observable = this.authService.login(email, password);
        } else {
          // signup request
          observable = this.authService.register(email, password);
        }
        observable.subscribe(
          firebaseResponse => {
            console.log(firebaseResponse);
            ctrl.dismiss();
            console.log('Navigate By Url');
            this.router.navigateByUrl('/places/tabs/discover');
          },
          error => {
            console.log(error);
            const ErrorMessage: string = error.error.error.message;
            let message = 'Something went wrong!';
            switch (ErrorMessage) {
              case 'EMAIL_EXISTS':
                message = 'Email already registered';
                break;
              case 'EMAIL_NOT_FOUND':
                message = 'Email not found!';
                break;
              case 'WEAK_PASSWORD : Password should be at least 6 characters':
                message = 'Password should be at least 6 characters long!';
                break;
              case 'INVALID_PASSWORD':
                message = 'Invalid Password';
                break;
              case 'USER_DISABLED':
                message = 'User is banned, Please contact administrator';
                break;
              case 'OPERATION_NOT_ALLOWED':
                message = 'Password Sign in is disabled';
                break;
              case 'TOO_MANY_ATTEMPTS_TRY_LATER':
                message =
                  'Access is blocked as we have detected unusual activity, Please try again later';
                break;
              default:
                message = 'Something went wrong';
            }
            ctrl.dismiss();
            this.alertCtrl
              .create({
                header: 'An Error Occurred',
                message: message,
                buttons: ['Okay']
              })
              .then(alertEl => alertEl.present());
          }
        );
      });
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;
    this.authenticate(email, password);
  }
}
