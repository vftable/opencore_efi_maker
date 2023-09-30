import gradient from "gradient-string";

export class Logger {
    formatDate(date: Date) {
        return `${(date.getHours()+'').padStart(2,'0')}:${(date.getMinutes()+'').padStart(2,'0')}:${(date.getSeconds()+'').padStart(2,'0')}.${(date.getMilliseconds()+'').padStart(3,'0')}`
    }

    clear() {
        console.clear();
    }

    newline() {
        console.log();
    }

    info(message: any) {
        console.log(`[${this.formatDate(new Date())}] [*] ` + message);
    }

    success(message: any) {
        console.log(gradient.pastel(`[${this.formatDate(new Date())}] [+] `) + message);
    }

    error(message: any) {
        console.log(gradient.morning(`[${this.formatDate(new Date())}] [-] `) + message);
    }
}