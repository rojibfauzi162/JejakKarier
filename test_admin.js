import * as admin from "firebase-admin";
console.log("admin keys:", Object.keys(admin));
console.log("admin.apps:", admin.apps);
console.log("admin.default:", admin.default ? Object.keys(admin.default) : undefined);
