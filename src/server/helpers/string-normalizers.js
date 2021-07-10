import remove from 'confusables';
import passwordHash from 'pbkdf2-password-hash';
import disposableEmail from "temporary-email-address-validator";
import EmailValidator from "email-deep-validator";
import {filterXSS} from "xss";
import dayjs from 'dayjs'
import {parseDomain, ParseResultType} from "parse-domain";

const { getCode, getName } = require('country-list');
var utc = require('dayjs/plugin/utc')


function isValidUsername(v) {
    if (!v) return false;
    var re = /^[a-zA-Z0-9]+$/;
    return re.test(v);
}

export function AppsbyValidateUserHandle(username) {
    username = remove(username);
    username = username.toLowerCase();
    if (!username.match(/([a-z0-9]+(-[A-z0-9]+)?)/)) return false;
    if (SPECIAL_HOSTNAMES.includes(username)) return false;
    if (PROTOCOL_HOSTNAMES.includes(username)) return false;
    if (CA_ADDRESSES.includes(username)) return false;
    if (RFC_2142.includes(username)) return false;
    if (NOREPLY_ADDRESSES.includes(username)) return false;
    if (SENSITIVE_FILENAMES.includes(username)) return false;
    if (OTHER_SENSITIVE_NAMES.includes(username)) return false;
    if (isValidUsername(username)) return username;
    return false;
}


let SPECIAL_HOSTNAMES = [
    "autoconfig",
    "autodiscover",
    "broadcasthost",
    "isatap",
    "localdomain",
    "localhost",
    "wpad",
]


let PROTOCOL_HOSTNAMES = [
    "ftp",
    "imap",
    "mail",
    "news",
    "pop",
    "pop3",
    "smtp",
    "usenet",
    "uucp",
    "webmail",
    "www",
]


let CA_ADDRESSES = [
    "admin",
    "administrator",
    "hostmaster",
    "info",
    "is",
    "it",
    "mis",
    "postmaster",
    "root",
    "ssladmin",
    "ssladministrator",
    "sslwebmaster",
    "sysadmin",
    "webmaster",
]


let RFC_2142 = [
    "abuse",
    "marketing",
    "noc",
    "sales",
    "security",
    "support",
]


let NOREPLY_ADDRESSES = [
    "mailer-daemon",
    "nobody",
    "noreply",
    "no-reply",
]


let SENSITIVE_FILENAMES = [
    "clientaccesspolicy.xml",
    "crossdomain.xml",
    "favicon.ico",
    "humans.txt",
    "keybase.txt",
    "robots.txt",
    ".htaccess",
    ".htpasswd",
]


let OTHER_SENSITIVE_NAMES = [
    "account",
    "accounts",
    "auth",
    "authorize",
    "blog",
    "buy",
    "cart",
    "clients",
    "contact",
    "contactus",
    "contact-us",
    "copyright",
    "dashboard",
    "doc",
    "docs",
    "download",
    "downloads",
    "enquiry",
    "faq",
    "help",
    "inquiry",
    "license",
    "login",
    "logout",
    "me",
    "myaccount",
    "oauth",
    "pay",
    "payment",
    "payments",
    "plans",
    "portfolio",
    "preferences",
    "pricing",
    "privacy",
    "profile",
    "register",
    "secure",
    "settings",
    "signin",
    "signup",
    "ssl",
    "status",
    "store",
    "subscribe",
    "terms",
    "tos",
    "user",
    "users",
    "weblog",
    "work",
]

export function ThrowString(variable){
    if (typeof variable !== "string") throw new Error("[500] Type violation.");
}

export function ThrowBoolean(variable){
    if (typeof variable !== "boolean") throw new Error("[500] Type violation.");
}

export function ThrowNumber(variable){
    if (typeof variable !== "number") throw new Error("[500] Type violation.");
}

export function ThrowObject(variable){
    if (typeof variable !== "object") throw new Error("[500] Type violation.");
}

export function ThrowSymbol(variable){
    if (typeof variable !== "symbol") throw new Error("[500] Type violation.");
}

export function ThrowBigInt(variable){
    if (typeof variable !== "bigint") throw new Error("[500] Type violation.");
}

export function ThrowFunction(variable){
    if (typeof variable !== "function") throw new Error("[500] Type violation.");
}

export function ThrowUndefined(variable){
    if (typeof variable !== "undefined") throw new Error("[500] Type violation.");
}

export function IsObjectEmpty(object) {
    for(var prop in object) {
        if(object.hasOwnProperty(prop))
            return false;
    }

    return true;
}


export function AppsbyValidateName(name) {
    ThrowString(name);
    name = filterXSS(name);
    if (name) {
        return name
    }
}


export async function AppsbyValidateEmailAddress(emailAddress) {

    ThrowString(emailAddress);
    emailAddress = filterXSS(emailAddress);
    const emailValidator = new EmailValidator();
    const { wellFormed, validDomain } = await emailValidator.verify(emailAddress);
    const isNonDisposable = disposableEmail.validate(emailAddress);
    if (!wellFormed || !validDomain || !isNonDisposable) throw new Error("[500] Bad email.");
    if (emailAddress) {
        return emailAddress
    }
}

export function AppsbyValidateStreetAddress(apartmentNumber, streetNumber, streetName, suburbCity, postalCode, country) {

    if (apartmentNumber) {
        ThrowString(apartmentNumber);
        let apartmentNumberAsNumber = parseInt(apartmentNumber)
        if (Number.isNaN(apartmentNumberAsNumber)) {
            return { incorrectField: "apartmentNumber", incorrectValue: apartmentNumber, error: "Not a number." }
        }
    }

    if (streetNumber) {
        ThrowString(streetNumber);
        let streetNumberAsNumber = parseInt(streetNumber)
        if (Number.isNaN(streetNumberAsNumber)) {
            return { incorrectField: "streetNumber", incorrectValue: streetNumber, error: "Not a number." }
        }
    }

    ThrowString(streetName);
    streetName = filterXSS(streetName);
    ThrowString(suburbCity);
    suburbCity = filterXSS(suburbCity);
    ThrowString(postalCode);
    postalCode = filterXSS(postalCode);
    ThrowString(country);
    country = filterXSS(country);
    const code = getCode(country);
    if (code === undefined){
        return { incorrectField: "country", incorrectValue: country, error: "Couldn't find country." }
    }

    if (streetNumber && streetName && suburbCity && postalCode && country && code) {
        return { streetNumber, streetName, suburbCity, postalCode, countryCode: code }
    } else {
        throw new Error("[400] Unknown address.")
    }

}

export async function AppsbyValidatePassword(password) {
    ThrowString(password);
    let hash = await passwordHash.hash(password);
    if (password && hash) {
        return hash
    }
    return false
}

export async function AppsbyCheckPassword(hash, inputPassword) {
    ThrowString(inputPassword);
    let result = await passwordHash.compare(inputPassword, hash);
    if (inputPassword && result) {
        return true
    }
    return false
}

export async function AppsbyValidateDate(date, dateOrder = "DD-MM-YYYY") {

    dayjs.extend(utc)

    if (date instanceof Date && !Number.isNaN(date) || typeof date === "number") {
        return dayjs.utc(date).toJSON();

    } else if (typeof date === "string" && dateOrder) {
        return dayjs.utc(date, dateOrder).toJSON();
    }

    return false
}

export async function AppsbyValidateDomainName(domainName) {

    let originalDomain = domainName.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
    let parseResult = parseDomain(originalDomain);
    let parseResultGuarantee = parseDomain(process.env.websiteAddress)
    if (parseResult.type === ParseResultType.Listed) {
        let icannGuarantee = parseResultGuarantee.icann;
        return icannGuarantee.domain + "." + icannGuarantee.topLevelDomains.join(".")
    }
}

export async function AppsbyValidateDomainNameNoICANN(domainName) {
    let originalDomain = domainName.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
    return originalDomain.split("/")[0];
}
