# 🎧 podtc · טירת כרמל באוזניים

![podtc](assets/logo.png)

**מבית עיריית טירת כרמל**

אפליקציית ווב (PWA) שהופכת את טירת כרמל לפודקאסט אחד גדול.
מפעילים שירותי מיקום ומתחילים ללכת. האפליקציה מסמנת על המפה איפה אתם נמצאים,
ובכל פעם שנכנסים לאזור של מקום עם סיפור, מתנגן **פרק של דקה או שתיים בעברית** על המקום.

## 🎨 עיצוב (גרסה 2)
- שפה חזותית בכחול כהה, תכלת ולבן, לפי הלוגו: זכוכית מטושטשת, הילות תכלת ומעברי צבע.
- מפה כהה (CARTO Dark) עם גוון כחול, וסיכות זוהרות בצבע לפי נושא.
- מסך פתיחה עם הלוגו, ונגן מלא בסגנון אפליקציות פודקאסט.

## גרסה 12: עיצוב של אפליקציית פודקאסטים
העיצוב נבנה לפי הדפוסים של השירותים המובילים: BBC Sounds, Spotify, Apple Podcasts, Overcast ו־TuneIn:
- **עטיפה לכל פרק** (`js/covers.js`): צילום אוויר אמיתי של המקום (Esri), צבוע בכחול האפליקציה. אם הצילום לא נטען, מוצג דפוס קווי גובה ייחודי לכל פרק
- **גישה מהירה** בראש העמוד, בסגנון Spotify: מהדורה יומית, המשך האזנה, הסיור, הפרק הקרוב, רדיו וחי עכשיו
- **"פרק היום"** בסגנון עמוד תוכנית ב־Apple Podcasts: עטיפה גדולה וכפתור השמעה עגול
- **מדפים** של עטיפות לפי נושא, עם כפתור השמעה על העטיפה
- **סיורים** ככרטיסים רחבים עם עטיפות התחנות
- **רדיו** עם לוגואים עגולים, בסגנון TuneIn
- **נגן תחתון** עם העטיפה, ונגן מלא שהרקע שלו נצבע מהעטיפה
- **סדר חדש:** קודם האזנה, ואחר כך שירותי העירייה, חי עכשיו ושאר המדורים. גופן Heebo. אותה פלטה: תכלת כהה, כחול כהה ולבן

## גרסה 11: עיצוב חדש "כרמל עיתונאי", דסקטופ וקול טבעי יותר
העיצוב נבנה ב־Claude Design: לוח עם שפה חזותית, עמוד ראשי בדסקטופ, עמוד ראשי במובייל ונגן.
- **צבעים**: ירוק אורני הכרמל (`#0E4D3F`), כתום פריחת השקדים לפעולות (`#B4501A` ו־`#F2B872`), ורקע נייר מרווה (`#F3F5F2`). הקוד ב־`css/theme.css`
- **טיפוגרפיה**: כותרות ב־Frank Ruhl Libre בסגנון עיתון, וגוף טקסט ב־Assistant
- **בלי אימוג'י**: סט אייקוני קו (`js/icons.js`) לנושאים, מזג אוויר, שירותים ורשתות. משטחים שטוחים, בלי מעברי צבע מבריקים
- **דסקטופ**: ניווט בכותרת העליונה, נגן קבוע בתחתית המסך, הנגן המלא כפאנל צד, ומדורים ברשת של 2 עד 6 עמודות. יש גם התאמה לטאבלט
- **קול טבעי יותר**: עדיפות לקולות טבעיים (Edge, Google), קצב מעט איטי יותר (×0.95), הפסקות בין משפטים ובין פסקאות, פתיח מוזיקלי קצר ומוזיקת רקע עדינה (WebAudio, אפשר לכבות). טיפ חד־פעמי כשבמכשיר יש רק קול רובוטי
- **לאיכות של קריין אמיתי**: מקליטים או מפיקים MP3 (למשל Google Cloud TTS בקול Chirp 3 HD) ומגדירים `audio:` לכל פרק. הנגן כבר תומך בזה

## 🆕 גרסה 10: מהדורה קולית, טיקטוק מתוקן ועוד
- 🎵 **טיקטוק תוקן**: במקום iframe פשוט (שטיקטוק לא תומך בו לפרופילים) יש עכשיו **הטמעה רשמית** (creator embed עם embed.js). אם הפיד לא נטען תוך 7 שניות, מופיע כרטיס בסגנון טיקטוק עם "פתחו בטיקטוק", "חיפוש העירייה" ו־QR. גם מתחת לפייסבוק ויוטיוב יש תמיד כרטיס עם קישור.
- ⚙️ **`js/config.js`**: העירייה יכולה לשנות שם משתמש בטיקטוק, פייסבוק ויוטיוב, ולהוסיף **סרטוני טיקטוק נבחרים** לפי מזהה. סרטון בודד מוטמע בנגן הרשמי של טיקטוק ועובד תמיד.
- 🎙️ **מהדורת טירת כרמל**: עדכון קולי של כ־2 דקות בקול שנבחר, עם תאריך לועזי ועברי, מזג אוויר ותחזית למחר, איכות אוויר, מצב הים, זמני שבת ופרשה, החג הבא, כותרות על העיר ופרק היום
- 💡 **הטיפ של היום לפי מזג האוויר**: ביום גשום מוצע סיור מהבית, ביום חם עין קדם, וביום נעים יוצאים לסיור
- 🎉 **החג הבא**, עם ספירה לאחור (Hebcal)
- 🧒 **פינת הילדים**: המשחק "ניקי שומרת על הניקיון", סיור משפחות, רדיו שירי ילדים ושירי דיסני, וחידון
- 📸 **מסגרת podtc**: מצלמים או בוחרים תמונה ומקבלים תמונה ממותגת עם "📍 הייתי כאן", שם המקום הקרוב והתאריך, לשיתוף או לשמירה
- 🔗 **קישורים נוספים**: פיקוד העורף, תחבורה ציבורית לטירת כרמל, ניווט בוויז לעירייה, משחק ניקי
- 🛠️ תיקונים: מספרים עשרוניים ושעות ("0.7", "16:23") מוקראים נכון, והרדיו נסגר בלי שגיאות

## 🆕 גרסה 9: חי, רדיו, קולות ושירותי העירייה
| תכונה | פירוט |
|---|---|
| 🎙️ **בחירת קול** | בחירה מכל הקולות העבריים במכשיר (כולל הקולות הטבעיים "הילה" ו"אברי" ב־Edge), גובה קול (נמוך, רגיל, גבוה) ודוגמה. כפתור "קול" בנגן עובר בין הקולות |
| 🔴 **חי עכשיו בטירת כרמל** | מזג אוויר ותחזית ל־3 ימים, איכות אוויר, מצב הים, זריחה ושקיעה ומדד UV (Open-Meteo), זמני שבת ופרשה ותאריך עברי (Hebcal), סיכום מוויקיפדיה, ומתעדכן כל 10 דקות |
| 📰 **חדשות מהרשת** | כותרות על טירת כרמל מאתרי חדשות מקומיים ומגוגל ניוז. אם המקורות לא זמינים, מוצגים קישורים ישירים |
| 📻 **רדיו חי** | 16 תחנות: רדיו חיפה 107.5, רדיו צפון 104.5, כאן ב, גימל, 88, תרבות, מורשת, רקע וקול המוזיקה, גלגלצ, גלי צה"ל, 103FM, רדיוס, קול חי, הקצה ו־102FM. פס רדיו, טיימר כיבוי (15/30/60) ומסך נעילה. פרק שמתחיל משהה את הרדיו |
| 📱 **העירייה ברשתות** | טיקטוק (`@tiratcarmel.muni`), עמוד הפייסבוק (TCarmel.muni) וערוץ היוטיוב משובצים בדף (iframe), עם קישורים לפתיחה באפליקציות |
| 🏛️ **שירותי העירייה** | מוקד 106, תשלומים מקוונים, ארנונה והוראת קבע, דיווח מפגע עם מיקום מדויק, אתר העירייה הרשמי, המרכזייה, המתנ"ס והפייסבוק. שורת מספרי חירום (100, 101, 102, 104, 106) |
| 🖨️ **שלטי QR** (`print.html`) | שלט להדפסה לכל אחד מ־30 המקומות. סריקה פותחת את הפרק ישירות, וכשמגיעים מהשלט הפרק מתחיל מיד |
| 🔳 **QR לאפליקציה** | בכרטיס השיתוף, לסריקה מטלפון אחר |
| 🧭 **ניווט מהיר** | צ'יפים בראש העמוד: שירותים, חי עכשיו, רדיו, ברשתות, העתיד, פרקים, קישורים |

> מקורות הנתונים החיים (Open-Meteo, Hebcal, Wikipedia, rss2json) חינמיים, לא דורשים מפתח, ונטענים רק כשמגיעים למדור.
> חשבון הטיקטוק `@tiratcarmel.muni` הוזן לפי הבקשה. כדאי לוודא שזה החשבון הרשמי.

## 🆕 גרסה 8: העיר של מחר
- 🚌 **המטרונית מגיעה לרחוב הרצל**: תוואי של כ־10 ק"מ עם כ־30 תחנות בחיפה ובטירת כרמל, השקעה של כ־700 מיליון ש"ח
- 🏘️ **שכונת החותרים**: 2,153 דירות על כ־800 דונם, פארק נחל גלים ושדרוג הכניסה הדרומית
- 🏗️ **מרכז העיר מתחדש**: מתחם הרצל–ביאליק–מוצקין (כ־1,284 דירות), מגדלי ביאליק ושרת, והחזון של 4,700 דירות בפינוי־בינוי
- 📊 **"טירת כרמל ב־2040: התוכניות במספרים"**: מדור מיוחד בעמוד הראשי עם כפתור "האזינו לכל פרקי העתיד ברצף"
- סיור "העיר של מחר" הורחב ל־9 תחנות. פרק העירייה עודכן עם ראש העירייה הנוכחי. סה"כ **30 פרקים**

## 🆕 גרסה 7: עוד תוכן ועוד חוויה
- 🎧 **3 פרקים חדשים (27 בסך הכול)**:
  - 🎸 **הילד מטירת כרמל שהפך לכוכב רוק**: חיים וייץ, הוא ג'ין סימונס מ־KISS
  - 🐄 **כפר הנוער גלים**
  - 🦌 **חי בר כרמל**: היחמורים שהגיעו בטיסה האחרונה מאיראן, והנשרים
- ♥ **מועדפים**: לב בנגן, מדור "המועדפים שלי" בעמוד הראשי, וסינון "♥ מועדפים" במפה
- ▶ **השמעה רציפה**: "הכול ברצף" לכל מדור, "🛋️ מהבית" לכל סיור (כל הסיור בלי ללכת), ו"השמיעו ברצף" למועדפים
- ⏯️ **המשיכו להאזין**: האפליקציה זוכרת איפה עצרתם בכל פרק וממשיכה מאותו משפט
- 🔥 **רצף האזנה** יומי ותג "רצף 3 ימים"
- 🌙 **מצב כהה** לעמוד הראשי, אוטומטית לפי הגדרות הטלפון

## 🆕 גרסה 6: עמוד ראשי בסגנון אתר חדשות
- 📰 **עמוד ראשי** (`js/home.js`): ברכה לפי שעה, תאריך, מזג אוויר חי בטירת כרמל (Open-Meteo), "פרק היום" כידיעה ראשית, "קרוב אליכם עכשיו", מונים מונפשים, סיורים, "הידעתם?" מתחלף, ומדורים לפי נושא בעיצוב חדשותי
- 🔴 **פס מבזקים** רץ: פרקים חדשים, מזג האוויר וכמה פרקים קרובים אליכם
- 📤 **כפתורי שיתוף**: וואטסאפ, פייסבוק, טלגרם, X, מייל, העתקת קישור ו"עוד" (שיתוף מערכת). מופיעים בפרק היום, בכל פרק בנגן ובשיתוף האפליקציה
- 📲 **הוספה למסך הבית**: כרטיס בעמוד הראשי ולשונית "התקנה". באנדרואיד ובכרום נפתחת התקנה ישירה. באייפון מוצגות הוראות צעד אחר צעד ל־Safari
- 🔗 **קישורים שימושיים**: אתר העירייה, מוקד 106, מרכזיית העירייה, המתנ"ס, אם הבנים, חי בר כרמל, רשות הטבע והגנים, עין קדם, רכבת ישראל, מנהרות הכרמל, ויקיפדיה, המועצה לשימור אתרי מורשת
- 🧭 **סרגל ניווט תחתון**: ראשי, מפה, ספרייה, התקנה

## 🆕 גרסה 5: חידון, 5 סיורים, מצב עורך ועוד
| תכונה | פירוט |
|---|---|
| 🧠 **חידון** | שאלה לכל אחד מ־24 הפרקים (`js/quiz.js`), 10 נקודות לתשובה נכונה. אחרי כל פרק מופיעה הזמנה לחידון |
| ⭐ **נקודות ותגים** | 5 נקודות לכל פרק ו־10 לכל תשובה נכונה. 7 תגים: מאזינ/ה ראשון/ה, סייר/ת, חוקר/ת העיר, ראש גדול, אלופ/ת החידון, מסיימ/ת סיור, מכיר/ה כל פינה |
| 🚶 **5 סיורים** | מהכפר אל המעיין · מורשת ובתי כנסת · טבע ומים בכרמל · סיור משפחות קצר · העיר של מחר (באופניים). לכל סיור פס התקדמות וכפתור "המשיכו". סדר התחנות מחושב אוטומטית למסלול הליכה הגיוני |
| 🛠️ **מצב עורך** | לחיצה 5 פעמים על הלוגו (או `?edit` בכתובת) פותחת אותו. אפשר לגרור סיכות, ללחוץ "קבעו כאן לפי המיקום שלי" כשעומדים במקום, ולשנות רדיוס. בסוף מייצאים JSON ושולחים אותו לעדכון לכולם |
| 🔍 **חיפוש** | חיפוש בכותרות, בנושאים ובתוך תוכן הפרקים |
| 📤 **כרטיס הישג** | תמונה ממותגת ("גיליתי X% מטירת כרמל") לשיתוף בוואטסאפ ובאינסטגרם |
| ♿ **נגישות** | מצב טקסט גדול וניגודיות גבוהה |
| 📥 **מפה בלי אינטרנט** | שמירת אריחי המפה של כל העיר לטיול בלי קליטה |
| ✉️ **משוב** | "הציעו מקום או דווחו על טעות", עם שם המקום בגוף ההודעה |

### איך מעדכנים מיקומים לכולם
1. פותחים את האפליקציה בטלפון ולוחצים 5 פעמים על הלוגו (מצב עורך).
2. בכל מקום: פותחים את הפרק, עומדים בנקודה ולוחצים "📍 קבעו כאן". אפשר גם לגרור את הסיכה במפה.
3. בספרייה לוחצים "📋 ייצוא מיקומים" ושולחים את `podtc-locations.json`.
4. מעדכנים את `lat`, `lng` ו־`radius` ב־`js/places.js`. הקובץ כבר מכיל את המזהים, אז זו החלפה פשוטה.

## 🆕 גרסה 4: 24 פרקים ו־12 נושאים
פרקים חדשים:
- 🕯️ **בית הכנסת אם הבנים** (הפלמ"ח 12): כנסייה צלבנית(?), מסגד (1579) ובית כנסת, והמבנה הראשון בעיר שהוכרז לשימור
- 🏛️ **בית המוח'תאר**: בית ראש הכפר שהפך לתחנת המשטרה
- 🏺 **מה מסתתר מתחת לרגליים**: ארכיאולוגיה מתקופת הברונזה ועד הצלבנים
- 🕊️ **קיץ 1948**: הקרבות על הכפר, בשני הנרטיבים
- 💧 **עין קדם**: מעיין בתוך נקבות חצובות, בנחל נדר
- 🥾 **מסלול נחל כלח ונחל גלים**
- 🏢 **עיריית טירת כרמל** (הרצל 6)
- 🎭 **המתנ"ס ומרכז האומנויות** (ז'בוטינסקי 43)
- ⚽ **הכדורגל** נכתב מחדש, עם היסטוריה של הפועל טירת כרמל מ־1949

נושאים חדשים: מבנים ובתי כנסת עתיקים, ספורט, עירייה, מסלולי הליכה. "זיכרון" שונה ל"אירועים חשובים".
הסיור המודרך הורחב ל־11 תחנות: "מהכפר אל המעיין" (כ־3 ק"מ).

## 🆕 גרסה 3: מפה אמיתית, סיור מודרך ונושאים חדשים
| שדרוג | פירוט |
|---|---|
| 🛰️ מפת לוויין אמיתית | צילום אוויר ברזולוציה גבוהה (Esri World Imagery) עם שמות רחובות בעברית מעליו. זו ברירת המחדל |
| 🗺️ 3 סגנונות מפה | לוויין, רחובות (CARTO Voyager, מפה מפורטת בצבע) ולילה (הסגנון הכחול של המותג). מחליפים בכפתור, והבחירה נשמרת |
| 🧭 מצפן | אלומה כחולה ליד הנקודה שלכם מראה לאן אתם מסתכלים (חיישן הטלפון, ובהליכה גם כיוון ה־GPS) |
| 🚶 סיור מודרך | "מהכפר אל ההר": 9 תחנות ממוספרות, מסלול מסומן על המפה, ובאנר "התחנה הבאה" עם חץ כיוון, מרחק וזמן הליכה. בסוף כל פרק הסיור ממשיך לתחנה הבאה |
| 👁️ מבט מהרחוב | פותח את Google Street View בנקודה, לראות את המקום לפני שמגיעים |
| 🏷️ נושאים חדשים | **זיכרון** ו**תחבורה** (סה"כ 7 נושאים) |
| 🎧 5 פרקים חדשים | שריפת הכרמל 2010 · פסיפס העליות · טירת השקדים · הכרמל של אונסק"ו · השער הצפוני (רכבת, כביש החוף ומנהרות הכרמל). סה"כ **16 פרקים** |

> שכבות המפה (Esri ו־CARTO) חינמיות לשימוש בהיקף קטן ועם ייחוס. בהשקה רשמית כדאי לעבור למפתח API
> (למשל Esri, MapTiler או Mapbox), או למפת תלת־ממד עם בניינים (MapLibre ו־OpenFreeMap).

## 🆕 שדרוגים בגרסה 2
| שדרוג | מה זה נותן |
|---|---|
| 🎙️ נגן מלא | עטיפה עם טבעת מסתובבת, דילוג בין משפטים קדימה ואחורה, מהירות הקראה, "הפרק הקרוב" |
| 📜 תמליל חי | המשפט שמוקרא מודגש, ולחיצה על משפט קופצת אליו |
| 🏷️ נושאים | היסטוריה, קהילה, תרבות, טבע, העיר של מחר. סינון במפה וברשימה |
| 🏅 התקדמות ותגים | טבעת התקדמות, אחוז מהעיר שגיליתם, ותגים: מאזין/ה ראשון/ה, סייר/ת, חוקר/ת העיר, מכיר/ה כל פינה |
| 🔔 צליל הגעה | צליל עדין ורטט כשנכנסים לאזור של מקום |
| 🧭 ניווט | "ניווט למקום" פותח מסלול הליכה ב־Google Maps |
| 🔗 שיתוף | שיתוף פרק, וקישור ישיר שפותח את הפרק (`#old-core`) |
| 🎯 מעקב | המפה עוקבת אחרי ההליכה, וכפתור המיקום מחזיר את המעקב |
| ⏱️ משך | הערכת משך לכל פרק |
| 📲 התקנה | כפתור "התקנה למסך הבית" ואייקונים מהלוגו |
| 🎧 מסך נעילה | Media Session: כותרת ולוגו במסך הנעילה, עם כפתורי עצירה והפרק הבא |

## ✨ מה יש בגרסה הראשונה (MVP)

| תכונה | איך זה עובד |
|---|---|
| 🗺️ מפה | Leaflet ומפת CARTO Dark (נתוני OpenStreetMap), עם סיכה לכל מקום ועיגול שמסמן את אזור ההפעלה (geofence) |
| 📍 מיקום חי | `navigator.geolocation.watchPosition`, עם דיוק גבוה. המיקום **לא נשלח לשום שרת** |
| 🔔 הפעלה אוטומטית | כשנכנסים לרדיוס של מקום: רטט, והפרק מתחיל לבד (אפשר לכבות בהגדרות) |
| 🗣️ קריינות בעברית | Web Speech API עם קול `he-IL`. הטקסט מחולק למשפטים כדי שזה יעבוד גם בנייד. יש תמיכה בקובצי mp3 מוקלטים, שגוברים על ההקראה |
| 📚 24 פרקים | נכתבו ממקורות ברשת: ויקיפדיה, זוכרות, המכלול, מעריב, נדל"ן סנטר ועוד. לכל פרק יש קישורי מקור |
| 🌐 תוכן חי | במקום שאין בו פרק מוכן, האפליקציה מושכת ערכים קרובים מ**ויקיפדיה העברית** (geosearch) ומקריאה אותם |
| 📝 תמליל | אפשר לקרוא כל פרק כטקסט |
| ✅ התקדמות | סימון אילו פרקים כבר נשמעו, נשמר ב־localStorage |
| 🧪 מצב הדגמה | לא בטירת כרמל? לוחצים על המפה ו"הולכים" לשם |
| 📲 התקנה ואופליין | manifest ו־service worker. אפשר להוסיף למסך הבית, ומפות שכבר נצפו נשמרות |

### הפרקים
שריפת הכרמל · פסיפס העליות · טירת השקדים · הכרמל של אונסק"ו · השער הצפוני ·
לב העיר הוותיקה · שיכוני העולים הראשונים · בית הספר של הכפר · בית הכנסת בית תנחום ·
אזור התעשייה הצפוני · מתחם תע"ש · בין העיר לים · מורדות הכרמל · שכונת נוף ים ·
הכדורגל של טירת כרמל · שנות ה־80

> ⚠️ **הקואורדינטות משוערות.** אין לי גישה למדידה בשטח, ולכן כל נקודה מסומנת `approx: true`.
> הצעד הראשון לפני השקה הוא סיבוב רגלי בעיר ותיקון ה־`lat/lng` ב־`js/places.js`.

## ▶️ הרצה

```bash
python3 -m http.server 8000   # מתוך שורש הריפו
# http://localhost:8000/podtc/
```
מיקום ב־GPS עובד רק ב־HTTPS או ב־localhost. ב־GitHub Pages זה עובד מיד.

## 🧱 מבנה

```
podtc/
  index.html            מסך פתיחה, מפה, מיני־נגן, נגן מלא וספרייה
  assets/               לוגו ואייקונים
  js/places.js          ← כאן התוכן: מקומות, רדיוסים, תסריטים, נושאים וסיורים
  js/quiz.js            שאלות החידון (התשובה הראשונה היא הנכונה)
  js/app.js             מפה, מעקב מיקום, geofencing ו־UI
  js/narrator.js        נגן: mp3 או TTS בעברית
  js/wiki.js            תוכן חי מוויקיפדיה העברית
  js/geo.js             חישובי מרחק
  sw.js, manifest       PWA ואופליין
  vendor/leaflet        ספריית המפה (מקומית, בלי CDN)
  vendor/qrcode         יצירת קודי QR (MIT)
  js/live.js            קולות, חי עכשיו, חדשות, רדיו, רשתות, שירותי העירייה ו־QR
  print.html            שלטי QR להדפסה
  audio/                הקלטות אמיתיות (אופציונלי)
```

**הוספת מקום** = הוספת אובייקט ל־`js/places.js`. אין צורך לגעת בקוד.

---

## 🧭 איך ממשיכים לפתח: מפת דרכים

### שלב 1: אימות בשטח (שבוע)
- סיבוב רגלי וכיול קואורדינטות ורדיוסים: 150–250 מ' באזור צפוף, 400+ מ' באזורים פתוחים.
- בדיקה על אנדרואיד (Chrome ו־Google TTS עברית) ועל אייפון (Safari, קול "Carmit").
- ראיון 2–3 תושבים ותיקים, עיריית טירת כרמל וארכיון מקומי, כדי לאמת עובדות ולהוסיף סיפורים אישיים.

### שלב 2: איכות שמע (הקפיצה הכי גדולה בחוויה)
- להחליף את ה־TTS של הדפדפן ב**הקלטות אמיתיות**: קריין מקומי, או TTS עברי איכותי
  (Google Cloud TTS `he-IL-Wavenet` / Azure `he-IL-HilaNeural`), עם מוזיקת פתיחה קצרה.
- לשמור כ־`audio/<id>.mp3` ולהוסיף `audio:` במקום המתאים. הקוד כבר תומך בזה.

### שלב 3: תוכן בהיקף גדול
- סקריפט "צינור תוכן" בצד השרת (Node/Python), שמריץ לכל נקודה את השלבים האלה:
  1. איסוף מקורות (ויקיפדיה, אתר העירייה, כתבות, OSM, ארכיונים).
  2. **ניסוח תסריט פודקאסט בעברית עם מודל שפה** (Claude API), עם הנחיה לציין מקורות ולא להמציא.
  3. ייצור שמע ב־TTS ושמירה כ־mp3.
  4. **בדיקה אנושית** לפני פרסום. זה חשוב במיוחד בנושאים רגישים כמו 1948.
- לייבא נקודות עניין מ־OpenStreetMap (בתי כנסת, בתי ספר, פארקים ואנדרטאות), כדי להגיע ל־50–100 פרקים.

### שלב 4: מוצר
- מסלולים: "סיור היסטורי, 45 דק'", "טבע בכרמל", "סיור משפחות לילדים" (אפשר לשלב את ניקי!).
- התראות ברקע כשהמסך כבוי: דורש עטיפה כאפליקציה (Capacitor) עם background geolocation,
  כי PWA לא יכולה לעקוב אחרי מיקום כשהיא סגורה.
- שפות נוספות: ערבית, רוסית ואנגלית, בהתאם לאוכלוסיית העיר.
- תוכן מהקהילה: תושבים מקליטים זיכרון קצר על המקום, ואחרי מודרציה הוא נכנס לפרקים.
- סטטיסטיקה אנונימית: אילו פרקים נשמעים ואיפה אנשים עוצרים.

### רעיונות שדרוג נוספים (לא מומשו עדיין)
- **מסלולים מודרכים** עם קו על המפה, סדר פרקים וזמן הליכה ("סיור היסטורי, 45 דק'").
- **מוזיקת רקע ופתיח מותג** לכל פרק (ג'ינגל podtc של 3 שניות).
- **תמונות ארכיון** (לפני ואחרי) בתוך הנגן: מעברות, הכפר ושנות ה־80.
- **חידון קצר** בסוף כל פרק, שמעניק נקודות. מתאים לבתי ספר.
- **מצב נגישות**: טקסט גדול וניגודיות גבוהה.
- **אירועי העירייה** שקופצים לפי מיקום ("הערב בפארק: הופעה").
- **דשבורד לעירייה** לעריכת פרקים בלי קוד (CMS קטן) וצפייה בנתוני האזנה.

### שלב 5: שותפים
- עיריית טירת כרמל ומחלקת התרבות, בתי ספר (תוכנית "הכר את עירך"), החברה להגנת הטבע ורשות הטבע והגנים (הכרמל).

## 📄 מקורות עיקריים
- [טירת כרמל — ויקיפדיה](https://he.wikipedia.org/wiki/טירת_כרמל) · [Tirat Carmel](https://en.wikipedia.org/wiki/Tirat_Carmel) · [Al-Tira, Haifa](https://en.wikipedia.org/wiki/Al-Tira,_Haifa)
- [זוכרות — א־טירה](https://www.zochrot.org/villages/village_details/49200/en)
- [תוכנית המתאר — נדל"ן סנטר](https://www.nadlancenter.co.il/article/8168) · [מעריב](https://www.maariv.co.il/economy/realestate/article-1211715)
- [תחנת חוף הכרמל — המכלול](https://www.hamichlol.org.il/תחנת_הרכבת_חיפה_–_חוף_הכרמל) · [טיולי — נחל כלח וגלים](https://www.tiuli.com/articles/356)
- [מכבי עירוני טירת כרמל](https://en.wikipedia.org/wiki/Maccabi_Ironi_Tirat_HaCarmel_F.C.)

ספריית המפה Leaflet משמשת לפי רישיון BSD-2 (`vendor/leaflet/LICENSE`). נתוני המפה: © תורמי OpenStreetMap.

## v13 — digital news-site look
- White page, dark text; each topic in its own colour (kicker, section rule, play button, cover tint).
- Article cards with kicker, headline, two-line summary and meta; 4-column news grid on desktop.
- New sections: recently played, top 10, browse by topic, short episodes, "your podtc" stats.
- Global search (`/`), waveform seek, up next, related episodes, sleep timer, live "now playing" marker on cards, reveal motion.

## v14 — accessibility, legal strip, illustrated covers, interactive player
- Accessibility toolbar (`js/a11y.js`, `css/a11y.css`), built to IS 5568 / WCAG 2.0 AA. It includes:
  - text size up to 200%
  - contrast modes: high contrast, inverted, light background, grayscale, low saturation
  - highlight links and headings, readable font, line and letter spacing, right alignment
  - stop animations, large black or white cursor, reading guide, reading mask, hide images
  - read text aloud on click, describe elements on hover, strong keyboard focus outline
  - skip link, Alt+A shortcut, settings saved per device, accessibility statement page (`accessibility.html`)
- Legal strip at the bottom: "© כל הזכויות שמורות לעיריית טירת כרמל | האתר נבנה על ידי מחלקת דוברות והסברה | עיריית טירת כרמל".
- Logo recoloured navy (`assets/wordmark-navy.png`) so it is readable on white.
- Aerial photos removed: covers are illustrated, using the topic colour, drifting contour rings and the topic icon.
- Player:
  - drag the waveform to seek, with a sentence preview while dragging
  - elapsed and remaining time, "sentence x of y", live captions
  - speed chips; swipe the artwork for the next or previous episode; double-tap the artwork to like
  - keyboard shortcuts; tap the mini-player bar to seek

## v15 — living sound-wave artwork, vivid colour, articles, sharing
- Artwork: every episode is an animated sound wave in its topic's two-colour gradient, seeded per episode. Only on-screen waves animate, and the wave speeds up while the episode is playing.
- New researched episodes (35 in total): Rostam Bastuni, Reuven Atar, the planned city beach, the Weizmann–Jabotinsky towers and Herzl Street, each with a quiz question, added to the tours.
- "Current articles" section: live headlines from 2 Google News feeds and the local sites, plus hand-picked recent coverage linked to the matching episode.
- Sharing:
  - green share button in the header
  - share sheet with large brand buttons and a QR code
  - share button on every card
  - full-width "share the city" band
  - the player's share button opens the sheet
- More links: Radio Haifa, iplan (mavat), Kol Zchut, gov.il, MDA, Moovit, KKL, sea forecast, emergency numbers.
- Polish: animated brand gradient under the masthead, colour wash behind the lead story, gradient play buttons, larger radii, coloured shadows.

## v16 — bus lines, city facts, notice board, gallery, wider search, responsive audit
- Bus lines (`js/city.js`): 14 lines serving Tirat Carmel with a line/destination filter and links to real-time arrivals and timetables. Sources: bus.co.il, busnearby.co.il, markav.net.
- "Tirat Carmel in brief": 8 figures (population per National Insurance 1.10.2026, milestones, master-plan targets) and 9 expandable fact cards.
- Notice board: municipal notices are placed between the home sections and collected in one board. They are edited in `js/config.js` (`notices`), because Facebook posts cannot be read without the page owner's token.
- Gallery: the municipality's Facebook feed, buttons to its photo, video and event pages, and an optional `gallery` list of image links in `js/config.js` with a lightbox.
- Search: a search bar on the front page; results now include bus lines, city facts, notices, services and sections.
- Responsive audit at 320, 360, 390, 600, 768, 1024, 1280 and 1920 px: no horizontal overflow and no overlapping header items.

## v17 — municipal portal look, both logos, voice studio
- Look: white page with one family of blues from navy to tchelet. Welcome banner with the search field, a row of 12 round quick actions, and blue section titles (`css/muni.css`, `js/muni.js`).
- Logos: the municipality's logo sits beside the podtc logo in the masthead and the footer (`assets/muni-logo.png`).
- Voice studio: 8 narration styles (news, storyteller, deep, bright, calm, kids, fast, standard), every Hebrew voice on the device with a sample button, pitch and speed sliders, a music toggle, and instructions for installing more voices.
- All topic colours, tags and cards were remapped to the blue palette. Brand colours remain only on the WhatsApp, Facebook, Telegram and X share buttons.

## v18 — fixes after a full-page audit
- Contrast: service descriptions, small grey text and the WhatsApp, Telegram and Facebook share buttons now meet WCAG AA.
- Desktop: each topic shelf is one scrollable row instead of a half-empty grid.
- Order: services, bus lines and the notice board moved up, right after the articles.

## v20 — logo-only opening, boxed municipal grid
- Opening screen: only the podtc logo, pulsing with three "thinking" dots, for 3 seconds; then the site opens.
- Layout: every section sits in its own white box on a pale blue page, cards have square corners, and the quick actions are a grid of square tiles.

## v21 — illustrated topic scenes
- `js/art.js`: one hand-drawn vector scene per podcast topic (12 scenes), in the site's blues, with small looping motion. They are SVG, so they are sharp at any size and work offline.
- Covers show the topic's scene with the live sound wave as a small strip along the bottom. Episodes of the same topic alternate a mirrored version.

## v22 — an illustration for every episode
- `js/art.js` now holds a separate vector scene for each of the 35 episodes (tents of the 1949 transit camp, the almond tree in blossom, the Carmel fire with a firefighting plane, the spring tunnel at Ein Kedem, the Metronit, and so on). The 12 topic scenes remain as a fallback for future episodes.

## v24 — "digital radio" front, built to the approved mock-up
- `css/radio.css`, `js/radio.js`: navy and cyan on white. Utility bar, text logo "PODTC · THE CITY HAS A VOICE", main navigation, cyan LIVE button, "what's new" strip, welcome card ("העיר מדברת. אנחנו מקשיבים.") beside the PODTC radio card, three-point strip, "latest news", English eyebrows above section titles.
- "PODTC radio" plays all 35 episodes one after another, starting from a different episode each day.
- Player bar across the bottom on desktop: artwork, title, play, elapsed and total time, progress line with a knob, volume slider and copy-link button.
- Default map changed to the OpenStreetMap city map (Hebrew street names); satellite, light and night remain.

## v25 — content management, speech fix, colour accents, sharing
- **Management screen** (`admin.html`, `js/admin.js`): sign in with the GitHub user name and a fine-grained access token (Contents: Read and write on this repository). The screen edits episodes (text, order, hide, add, upload an mp3 recording), notices, articles, gallery, links, free blocks placed after any section, the "what's new" strip, section order and visibility, fixed texts and settings. Drafts stay in the manager's browser, "preview" shows them on the real site, and "publish" writes `js/content.js` to the deploy branch through the GitHub API. `js/content-apply.js` merges that file into the built-in content before the app starts.
- Because the screen commits straight to `claude/nicky-cleanup-game-g4cvvu`, fetch and merge that branch before pushing code to it.
- **Speech**: every sentence is watched. A silent primer runs inside the tap so the first sentence is allowed on phones; a sentence that never starts is retried once without a fixed voice; if it still fails the music stops and the listener is told and shown the transcript (`silent` event).
- **Colour**: navy and cyan still lead; sun, coral, green and violet accents appear on eyebrows, quick actions, figures, topic tiles, notices and cards (`css/pop.css`).
- **Sharing**: floating share rail on wide screens, share rows in both main cards, share buttons on news cards and notices, a share button in the player bar.
- **Motion**: scroll progress line, live clock, a marquee of topics, numbers that count up, moving colour in the welcome card, back-to-top button.

## v26 — the daily update
- Management screen, "העדכון היומי": title, date, speaker, text, and a recording made in the browser (microphone, listen, keep or discard) or an uploaded audio file. The newest entry is shown under the two main cards with a play button, share buttons and an archive of the previous seven. Without a recording the text is read by the device voice.

## v27 — live broadcast, share pages for WhatsApp, announcements
- **Live** (management screen → "שידור חי"): a switch plus a YouTube / Facebook Live link or an audio stream URL. While on, a red "on air" player opens the page and the LIVE button in the masthead leads to it. With YouTube and an empty link, the channel's current live stream is embedded. A permanent radio stream URL in Settings takes over the PODTC radio buttons (`js/onair.js`).
- **Share pages**: `node tools/build-share.js` generates `e/<id>.html` for every episode (Open Graph title, description and a 1200×630 picture in `assets/og/`, plus a light one-episode player, `js/listen.js`, `css/listen.css`) and `js/share-pages.js`. Share buttons now send these links, so WhatsApp shows a rich preview and the link opens straight on a player. Re-run the tool after adding built-in episodes. An episode with a `youtube` link is shared as that link, which WhatsApp plays in its own floating player.
- **Announcements** (management screen → "התראות"): a banner for everyone who opens the site, and a device notification for people who allowed notifications while the site is open or running in the background (the page checks for a new announcement every five minutes). Push to closed devices needs an external push service.
- The sign-in help now links to GitHub's token form with the name and the Contents permission pre-filled.

## v28 — pages, speed, dark mode, welcome screens
- **Pages** (`js/pages.js`): the front page keeps the essentials (main cards, search, quick actions, news, notices, services, near you, top 10, radio). Podcasts, news, the city and contact are separate pages (`#/podcasts`, `#/news`, `#/city`, `#/contact`) reached from the masthead menu and a new mobile tab bar (ראשי · פודקאסטים · חדשות · העיר · מפה). Links to a section on another page open that page first; the back button works.
- **Speed**: cover drawings are drawn only when they scroll into view, sections off screen are not laid out (`content-visibility`), and the 13 stylesheets are served as one minified file, `css/site.css`. **Edit the files listed in `tools/sources.json`, then run `node tools/build.js`** (csso installed, for minifying). Scripts stay separate on purpose. Lighthouse mobile (local server): performance 12 → about 66, accessibility 84 → 100, page elements 12,000 → 4,800. Most of the remaining load time is the 3-second opening logo.
- **Dark mode** (`css/dark.css`): follows the phone; a sun/moon switch in the masthead overrides it. Applied before first paint.
- **Welcome screens** (`js/welcome.js`): three screens on the first visit (what podtc is, location, install + notifications), shown once.
- **Episode pages** (`e/<id>.html`): a map of the place with walking and Waze directions, schema.org PodcastEpisode data, dark mode, and `sitemap.xml` for search engines. The player has a link to the episode page.
- **Visit counting**: GoatCounter (free, no cookies) loads only when a code is entered in the management screen, under Settings.

## v29 — recording studio, two human narrators
- Management screen → "אולפן הקלטות": every episode with its text as a scrolling teleprompter, one-click recording, a level meter with a "too loud" warning, playback, and "save and go to the next episode". Progress is tracked separately for a female and a male narrator (`audioF` / `audioM` on each episode). A ready-made file can be uploaded instead.
- Every take is cleaned up in the browser (`js/recorder.js`): mono, silence trimmed at both ends, volume evened out with a soft limit, short fades, encoded to 80 kbps MP3 with `vendor/lame` (lamejs, LGPL-3.0, unmodified) so it plays on every phone. The daily-update recorder uses the same path.
- Listeners choose "קריינית", "קריין" or "קול המכשיר" in the voice sheet; the other recording is the fallback, and episodes with no recording still use the device voice. Share pages offer the same choice when both recordings exist.

## v30 — live city map on the front page, neighbourhoods, white by default
- `js/homemap.js`: a live map on the front page (and the city page) with every episode as a point in its topic's colour, topic filter chips, a popup with "listen" and the episode page, your position, and the three nearest places. On phones the map is tapped once before it can be dragged, so page scrolling never gets stuck. It loads only when it comes into view.
- Fixed: a general `svg{width:22px}` and `max-width:100%` rule squeezed Leaflet's marker layer, which hid circle markers on every map.
- The water corporation is מעיינות החוף (joint with Kiryat Bialik since 2016); the earlier notice from another corporation was removed.
- The city page lists 21 neighbourhoods from the master-plan documents, marking those set for urban renewal, the new ones and the planned one.
- White by default: dark mode now only when chosen with the switch (it no longer follows the phone). Calmer front page: the floating share rail, English section labels, the moving topic strip and the decorative points line are gone; text and play buttons are larger. A missing device voice no longer opens the voice sheet by itself.
