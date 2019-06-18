export class User {
  constructor(
    public userId,
    public email,
    private _token,
    public tokenExpiryDate: Date
  ) {}

  get token() {
    if (!this.tokenExpiryDate || this.tokenExpiryDate <= new Date()) {
      // if tokenExpiryDate is not set or its smaller than the current date i.e expired, return null
      return null;
    }
    return this._token;
  }

  get remainingTimeForTokenExpire() {
    if (!this.token) {
      // token is expired
      return 0;
    }
    return this.tokenExpiryDate.getDate() - new Date().getTime();
  }
}
