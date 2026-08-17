# Morning Report Bot

// פונקציה שרצה כל בוקר ב-06:30

exports.sendMorningReport = functions.pubsub.schedule('30 6 * * *').timeZone('Asia/Jerusalem').onRun(async (context) => {

    // 1. שליפת הזמנות ממתינות מ-Firestore

    const snapshot = await admin.firestore().collection('orders').where('status', '==', 'pending').get();

    

    let report = "📅 *דוח בוקר - ח. סבן*\n\n";

    let count = 0;

    snapshot.forEach(doc => {

        const data = doc.data();

        count++;

        report += `📦 הזמנה מ-${data.sender}\n`;

    });

    report += `\nסה"כ הזמנות ממתינות: ${count}`;

    // 2. שליחה לקבוצת הוואטסאפ דרך ה-API של התוסף שלך

    // כאן תשלח בקשת POST לשרת המקומי/ענן של התוסף לשליחת ההודעה לקבוצה

    

    console.log("Morning report sent successfully.");

    return null;

});



בעברית מליאה עם כלים 🧰 אימוגי וטקסט מודגש סטודיו לעיצוב הודעות רגילות לפי מספר ולהציג הודעות און לייל אפליקציית מדמה ווצאף וcrm עיצוב מיוחד תואם מובייל חיבור לשרת  סקריפט שולח ומקבל הודעות בזמן אמת

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sidor-noa.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/56a3e455-3d51-4de8-9ef2-8a2afd5e6521).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
