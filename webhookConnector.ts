import * as childProcess from 'child_process';
import "simpleutils";
import { Webhook } from "./webhook/webhook";
import { Handler } from "flexiblepersistence";
import * as os from 'os';
// import * as webhook from 'node-webhooks';
// var Webhook = require('node-webhooks');
// import * as Webhook from 'node-webhooks';
import * as request from 'request';

export class WebhookConnector {
  private webhook: Webhook;
  private handler: Handler;
  private static instance: WebhookConnector = new WebhookConnector();

  constructor() {
    console.log("The Read is a singleton class and cannot be created!");
    this.handler = Handler.getInstance();
    this.webhook = new Webhook();
    if (WebhookConnector.instance) {
      throw new Error("The Read is a singleton class and cannot be created!");
    }

    WebhookConnector.instance = this;
  }

  private getWebhooks = () => {
    this.handler.readArray("webhooks", this.webhooksReceived);
  }

  private webhooksReceived = (error, result: Array<any>) => {
    if (error) {
      console.error(error);
    } else {
      if (result.length > 0) {
        console.log(result[0]);
        this.webhook.setId(result[0].id);
        this.webhook.setLink(result[0].link);
      }else{
        this.getNgrok();
      }
    }
  }

  public static getInstance(): WebhookConnector {
    return WebhookConnector.instance;
  }
  /**
   * GET all Heroes.
   */
  public startNgrok() {
    var arch = os.arch();

    if (arch.includes("arm")) {
      arch = "arm";
    }

    arch = os.platform() + arch.charAt(0).toUpperCase() + arch.slice(1);

    console.log("Starting ngrok...");
    childProcess.exec('sudo ./ngrok http ' + (process.env.PORT || 3000), { cwd: "ngrok/" + arch }, this.getWebhooks);
    this.getWebhooks();

    // this.handler.readArray("webhooks", this.webhooksReceived);
  }

  private getNgrok = () => {
    console.log("Get ngrok...");
    var options = {
      method: 'get',
      json: true,
      url: 'http://localhost:4040/api/tunnels',
      headers: {
        'Content-Type': 'application/json.',
        'User-Agent': 'request'
      }
    };
    request(options, this.ngrokData);
  }

  private ngrokData = (error, response, body) => {
    // console.log("Get ngrokData...");
    if (error) {
      console.error('Error :', error);
      this.startNgrok();
    } else {
      if (body.tunnels.length > 0) {
        console.log("ngrok:");
        for (var index = 0; index < body.tunnels.length; index++) {
          var element = body.tunnels[index];
          if (element.public_url.indexOf("https") != -1) {
            var newLink = element.public_url + "/refresh";
            console.log(index + ":" + element.public_url);
            if (this.webhook.getLink() != newLink) {
              console.log(this.webhook.getLink() + "!=" + newLink);
              this.webhook.setLink(newLink);
              // WebhookConnector.webhookLink = element.public_url + "/refresh";
              this.createWebhook();
            }
          }
        }
      } else {
        this.getNgrok();
      }
    }
  }

  private createWebhook = () => {
    request(this.webhook.getAddOptions(), this.webhookData);
  }

  private removeWebhook = () => {
    request(this.webhook.getDeleteOptions(), this.webhookData);
  }

  private webhookData = (error, response, body) => {
    if (error) {
      console.error('Error :', error);
    }
    if (body != undefined) {
      console.log('Body :', body);
      if (body.id != undefined) {
        this.webhook.setId(body.id);
        console.log("webhookID:" + this.webhook.getId());
      }
    }
  }

  /**
   * GET all Heroes.
   */
  public upgrade(pusher: any, repository: any) {
    if (pusher != undefined) {
      console.log(pusher.name + " pushed to " + repository.name);
    } else {
      if (repository != undefined) {
        console.log(repository.name + " pushed");
      }
    }
    console.log("Pulling code from Github...");

    this.removeWebhook();
    // reset any changes that have been made locally
    // childProcess.exec('sudo git reset --hard', this.currentReset);

    // childProcess.exec('sudo git reset --hard', { cwd: "../backApp" }, this.childReset);
  }

  private currentReset = (err, stdout, stderr) => {
    console.log("Current Reset:");
    this.showInfo(stdout, stderr);
    // and ditch any files that have been added locally too
    childProcess.exec('sudo git -C clean -df', this.currentClean);
  }

  private currentClean = (err, stdout, stderr) => {
    console.log("Current Clean:");
    this.showInfo(stdout, stderr);
    // now pull down the latest
    childProcess.exec('sudo git pull', this.currentPull);
  }

  private currentPull = (err, stdout, stderr) => {
    console.log("Current Pull:");
    this.showInfo(stdout, stderr);
  }

  private childReset = (err, stdout, stderr) => {
    console.log("Child Reset:");
    this.showInfo(stdout, stderr);
    // and ditch any files that have been added locally too
    childProcess.exec('sudo git clean -df', { cwd: "../backApp" }, this.childClean);
  }

  private childClean = (err, stdout, stderr) => {
    console.log("Child Clean:");
    this.showInfo(stdout, stderr);
    // now pull down the latest
    childProcess.exec('sudo git pull https://github.com/Judahh/appFramework.git master', { cwd: "../backApp" }, this.childPull);
  }

  private childPull = (err, stdout, stderr) => {
    console.log("Child Pull:");
    this.showInfo(stdout, stderr);

    // and npm install with --production
    // childProcess.exec('sudo npm install', WebhookConnector.install);
    // process.exit();
    // and run tsc
    // childProcess.exec('sudo tsc', Page.execCallback);
  }

  private showInfo(stdout, stderr) {
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.log(stderr);
    }
  }
}