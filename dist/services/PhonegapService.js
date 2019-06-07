"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client = require("phonegap-build-api");
const fs = require("fs-extra");
const assert_1 = require("assert");
const log_1 = require("../log");
class PhonegapService {
    constructor() { }
    start() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    authUser() {
        return new Promise((resolve, reject) => {
            client.auth({
                username: process.env["phonegap.username"],
                password: process.env["phonegap.password"]
            }, function (e, api) {
                if (e)
                    return reject(e);
                return resolve(api);
            });
        });
    }
    currentApp(api) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                api.get("/apps", function (e, data) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (e)
                            return reject(e);
                        return resolve(data.apps[0]);
                    });
                });
            });
        });
    }
    removePrevious(api) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentApp = yield this.currentApp(api);
            if (currentApp)
                yield this.removeApp(currentApp.id, api);
        });
    }
    buildApp(id, api) {
        return __awaiter(this, void 0, void 0, function* () {
            var options = {
                form: {
                    data: {
                        platforms: ["android"]
                    }
                }
            };
            return new Promise((resolve, reject) => {
                api.post(`/apps/${id}/build`, options, function (e) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (e)
                            return assert_1.rejects(e);
                        let refreshId = setInterval(() => {
                            api.get(`/apps/${id}`, (e, data) => __awaiter(this, void 0, void 0, function* () {
                                if (data.status.android === "complete") {
                                    clearInterval(refreshId);
                                    log_1.Log.info("android completed!");
                                    resolve();
                                }
                            }));
                        }, 5000);
                    });
                });
            });
        });
    }
    removeApp(id, api) {
        return new Promise((resolve, reject) => {
            api.del(`/apps/${id}`, (e, data) => {
                if (e)
                    return assert_1.rejects(e);
                if (data)
                    return resolve(data);
            });
        });
    }
    uploadApp(opts, api) {
        return __awaiter(this, void 0, void 0, function* () {
            var options = {
                form: {
                    data: {
                        title: opts.appName,
                        create_method: "file"
                    },
                    file: `./temp/${opts.uid}/package.zip`
                }
            };
            const pbApp = yield new Promise((resolve, reject) => {
                api.post("/apps", options, function (e, data) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (e)
                            reject(e);
                        log_1.Log.info("app uploaded", data);
                        // TODO: delete zip folder after upload
                        resolve(data);
                    });
                });
            });
        });
    }
    downloadApp(opts, id, api) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.ensureDir(`./public/apk/${opts.uid}`);
            let file = fs.createWriteStream(`./public/apk/${opts.uid}/${opts.appName}.apk`);
            yield api.get(`/apps/${id}/android`).pipe(file);
            return new Promise((resolve, reject) => {
                file.on("error", e => reject(e));
                file.on("close", () => resolve());
            });
        });
    }
}
exports.PhonegapService = PhonegapService;