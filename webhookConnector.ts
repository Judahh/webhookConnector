import * as childProcess from 'child_process';
import "simpleutils";
import { Webhook } from "./webhook/webhook";
import { Handler } from "flexiblepersistence";
import * as os from 'os';
// import * as webhook from 'node-webhooks';
// let Webhook = require('node-webhooks');
// import * as Webhook from 'node-webhooks';
import * as request from 'request';
require('dotenv').config();

export class WebhookConnector {
  private webhook: Webhook;
  private handler: Handler;
  private production: boolean;

  constructor(name: string, gitRepositoryUser: string, gitRepository: string, gitURL: string, production: boolean, host?: string, port?: number, link?: string) {
    console.log("The Read is a singleton class and cannot be created!");
    this.handler = new Handler(name, host, port);
    this.webhook = new Webhook(this.handler, gitRepositoryUser, gitRepository, gitURL, link);
    this.production=production;
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
      } else {
        this.getNgrok();
      }
    }
  }

  /**
   * GET all Heroes.
   */
  public startNgrok() {
    let arch = os.arch();

    if (arch.includes("arm")) {
      arch = "arm";
    }

    arch = os.platform() + arch.charAt(0).toUpperCase() + arch.slice(1);

    console.log("Starting ngrok...");
    console.log("ARCH:" + arch);
    console.log('sudo ./ngrok http ' + (process.env.PORT || 3000));
    childProcess.exec('sudo ./ngrok http ' + (process.env.PORT || 3000), { cwd: "ngrok/" + arch }, this.getWebhooks);
    this.getWebhooks();

    // this.handler.readArray("webhooks", this.webhooksReceived);
  }

  private getNgrok = () => {
    console.log("Get ngrok...");
    let options = {
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
        for (let index = 0; index < body.tunnels.length; index++) {
          let element = body.tunnels[index];
          if (element.public_url.indexOf("https") != -1) {
            let newLink = element.public_url + "/refresh";
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

  public upgrade(request: any) {
    console.log(request.action);
    if (request.action != undefined && request.action == "published") {
      console.log("Downloading from Github...", request.release);
      // console.log('curl -vLJO -H \'Accept: application/octet-stream\' \''+request.release.assets[0].url+'?access_token='+this.webhook.getToken()+'\'');
      let _self = this;
      childProcess.exec('curl -vLJO -H \'Accept: application/octet-stream\' \'' + request.release.assets[0].url + '?access_token=' + this.webhook.getToken() + '\'',
        { cwd: ".." },
        (err, stdout, stderr) => { _self.unzip(err, stdout, stderr, request.release.assets[0].name); }
      );

      console.log('REMOVE!!!');
      this.removeWebhook();
    }
  }


  public unzip = (err, stdout, stderr, fileName) => {
    console.log("UNZIP:");

    childProcess.exec('sudo unzip ' + fileName, { cwd: ".." }, this.restart);
    // this.showInfo(stdout, stderr);
  }

  public restart = (err, stdout, stderr) => {
    console.log("RESTART:");

    childProcess.exec('sleep 1; sudo npm start');
    process.exit();
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