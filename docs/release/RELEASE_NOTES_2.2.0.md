# v2.2.0 — store "What's new" text

Shipped 2026-11-20. The English text is the App Store "What's New in This Version" (the App Store
listing is English-only: Apple rejects Georgian outside Keywords). The Georgian text is the Google
Play release note (ka-GE, 450/500 characters); it is copied word for word from the daily rules
the owner approved in `src/locales/ka.json` (`rules_daily_*`), so no new Georgian was written.

## English

New: the Daily challenge.

• 10 questions every day, the same for everyone
• One attempt a day, no hints
• See where you stand on today's leaderboard
• Play every day to keep your streak going, and share your result
• A daily reminder so you don't miss a day (you can turn it off in Settings)

Also: the weekly leaderboard now starts at Monday 00:00 Tbilisi time, and our other apps are on the
Home screen.

## Georgian (ka-GE) — Google Play

```
<ka-GE>
დღის გამოწვევა
• ყოველდღე ყველა მოთამაშეს ერთი და იგივე 10 კითხვა ხვდება.
• უპასუხე ათივე კითხვას. შეცდომის შემდეგ თამაში გრძელდება. მინიშნებები არ არის.
• დღეში მხოლოდ ერთი მცდელობა გაქვს.
• დღევანდელ რეიტინგში ადგილი სწორი პასუხების რაოდენობაზეა დამოკიდებული. თანაბარი შედეგისას წინ ისაა, ვინც გამოწვევა უფრო სწრაფად დაასრულა.
• ყოველდღე დაასრულე გამოწვევა. თუ ერთ დღეს გამოტოვებ, ზედიზედ ნათამაშები დღეების ათვლა თავიდან დაიწყება.
</ka-GE>
```
