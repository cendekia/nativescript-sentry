import { Observable } from 'tns-core-modules/data/observable';
import * as app from 'tns-core-modules/application';
import * as dialogs from 'tns-core-modules/ui/dialogs';
import { DeviceOrientation } from 'tns-core-modules/ui/enums';
import * as Raven from 'raven-js';
import { SentryUser, SentryBreadcrumb, SentrySeverity } from './';
import * as http from 'tns-core-modules/http';
import * as platform from 'tns-core-modules/platform';
import { stringify } from './utils/utils';

// import * as orientation from 'nativescript-orientation';
import * as appversion from 'nativescript-appversion';

export class Common extends Observable {
    constructor() {
        super();
    }

    private static urlencode(obj) {
        let pairs = [];
        for (let key in obj) {
            if ({}.hasOwnProperty.call(obj, key))
                pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        }
        return pairs.join('&');
    }

    protected static _init(dsn: string, config?: any) {
        Raven.config(dsn)
            .setTransport((options) => {
                console.log('sending');
                http.request({
                    url: options.url + '?' + this.urlencode(options.auth),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': 'nativescript://'
                    },
                    content: JSON.stringify(options.data)
                })
                .then((res) => {
                    if (res.statusCode !== 200) {
                        if (options.onError) {
                            options.onError(new Error('Unable to connect to raven status code: ' + res.statusCode));
                        }
                    } else {
                        if (options.onSuccess) {
                             options.onSuccess();
                        }
                    }
                    }, (e) => {
                        console.log('error');
                        console.log(e);
                        if (options.onError) {
                             options.onError(e);
                        }
                    });
            })
            .setDataCallback((data) => {
                data.contexts = {
                    device: {
                        family: platform.device.manufacturer,
                        model: platform.device.model,
                        // orientation: DeviceOrientation[orientation.getOrientation()],
                        // battery_level: this.batteryPercent
                    },
                    os: {
                        name: platform.device.os,
                        version: platform.device.osVersion
                    },
                    runtime: {
                        name: 'nativescript',
                        // version: global.__runtimeVersion
                    }
                };

                return data;
            })
            .setRelease(appversion.getVersionNameSync())
            .install();
    }
    protected static _setUser(user: SentryUser) {
        Raven.setUserContext(user);
    }
    protected static _setTags(tags: any) {
        Raven.setTagsContext(tags);
    }
    protected static _setExtra(extra: any) {
        Raven.setExtraContext(extra);
    }
    protected static _clearContext() {
        Raven.clearContext();
    }
    protected static _captureMessage(message: string, options) {
        Raven.captureMessage(message, options);
    }
    protected static _captureException(exception: Error, options) {
        Raven.captureException(exception, options);
    }
    protected static _captureBreadcrumb(breadcrumb) {
        Raven.captureBreadcrumb(breadcrumb);
    }
}
