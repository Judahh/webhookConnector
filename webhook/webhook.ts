import { Handler, Event, Operation } from "flexiblepersistence";
require('dotenv').config();

export class Webhook {
  private id: number;
  private link: string;
  private data;
  private token;

  private addOptions;
  private readOptions;
  private readAllOptions;
  private updateOptions;
  private deleteOptions;

  private gitRepositoryUser;
  private gitRepository;
  private gitURL;

  private handler: Handler;

  constructor(link?: string) {
    this.handler = Handler.getInstance();
    this.token = process.env.TOKEN;
    this.gitRepositoryUser = process.env.GIT_REPOSITORY_USER;
    this.gitRepository = process.env.GIT_REPOSITORY;
    this.gitURL = process.env.GIT_URL;
    this.token = this.token.replaceAll("-NTK-", "");

    if (link) {
      this.setLink(link);
    }

    this.readOptions = {
      method: 'get',
      json: true,
      url: this.gitURL + '/' + this.gitRepositoryUser + '/' + this.gitRepository + '/hooks/' + this.id,
      headers: {
        'Authorization': 'token ' + this.token,
        'Content-Type': 'application/json.',
        'User-Agent': 'request'
      }
    };

    this.readAllOptions = {
      method: 'get',
      json: true,
      url: this.gitURL + '/' + this.gitRepositoryUser + '/' + this.gitRepository + '/hooks',
      headers: {
        'Authorization': 'token ' + this.token,
        'Content-Type': 'application/json.',
        'User-Agent': 'request'
      }
    };

    this.deleteOptions = {
      method: 'delete',
      json: true,
      url: this.gitURL + '/' + this.gitRepositoryUser + '/' + this.gitRepository + '/hooks/' + this.id,
      headers: {
        'Authorization': 'token ' + this.token,
        'Content-Type': 'application/json.',
        'User-Agent': 'request'
      }
    };
  }

  public setLink(link: string) {
    this.link = link;
    this.data = {
      "name": "web",
      "active": true,
      "events": [
        "release"
      ],
      "config": {
        "url": this.link,
        "content_type": "json"
      }
    }
    let stringData = JSON.stringify(this.data);

    this.addOptions = {
      method: 'post',
      body: this.data,
      json: true,
      url: this.gitURL + '/' + this.gitRepositoryUser + '/' + this.gitRepository + '/hooks',
      headers: {
        'Authorization': 'token ' + this.token,
        'Content-Length': Buffer.byteLength(stringData, 'utf8'),
        'Content-Type': 'application/json.',
        'User-Agent': 'request'
      }
    };

    this.updateOptions = {
      method: 'patch',
      json: true,
      url: this.gitURL + '/' + this.gitRepositoryUser + '/' + this.gitRepository + '/hooks/' + this.id,
      headers: {
        'Authorization': 'token ' + this.token,
        'Content-Length': Buffer.byteLength(stringData, 'utf8'),
        'Content-Type': 'application/json.',
        'User-Agent': 'request'
      }
    };
  }


  public getGitURL(): string {
    return this.gitURL
  }

  public getGitRepository(): string {
    return this.gitRepository
  }

  public getGitRepositoryUser(): string {
    return this.gitRepositoryUser
  }

  public setId(id: number) {
    this.id = id;
  }

  public getId() {
    return this.id;
  }

  public getLink() {
    return this.link;
  }

  public getData() {
    return this.data;
  }

  public getToken() {
    return this.token;
  }

  public eventResult = (error, result) => {
    console.log("RESULT EVENT");
    if (error) {
      console.error(error);
    } else {
      console.log(result);
    }
  }

  public getAddOptions() {
    let content = {
      id: this.id,
      link: this.link
    };
    let event = new Event(Operation.add, "webhook", content);

    this.handler.addEvent(event);
    return this.addOptions;
  }

  public getDeleteOptions() {
    let content = {
      id: this.id,
      link: this.link
    };
    let event = new Event(Operation.delete, "webhook", content);

    this.handler.addEvent(event);
    return this.deleteOptions;
  }

  public getCorrectOptions() {
    let content = {
      id: this.id,
      link: this.link
    };
    let event = new Event(Operation.correct, "webhook", content);

    this.handler.addEvent(event);
    return this.updateOptions;
  }

  public getUpdateOptions() {
    let content = {
      id: this.id,
      link: this.link
    };
    let event = new Event(Operation.update, "webhook", content);

    this.handler.addEvent(event);
    return this.updateOptions;
  }

  public getNonexistentOptions() {
    let content = {
      id: this.id,
      link: this.link
    };
    let event = new Event(Operation.nonexistent, "webhook", content);

    this.handler.addEvent(event);
    return this.deleteOptions;
  }
}