import admin from "firebase-admin"

function must(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function getPrivateKey() {
  return must("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n")
}

export const app =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert({
          projectId: must("FIREBASE_PROJECT_ID"),
          clientEmail: must("FIREBASE_CLIENT_EMAIL"),
          privateKey: getPrivateKey(),
        }),
      })

export const db = admin.firestore(app)
export const FieldValue = admin.firestore.FieldValue