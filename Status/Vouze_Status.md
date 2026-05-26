# Vouze — Current Status

## Live
- URL: vouze.app
- Repo: isaiahvaughn-blip/tripcrew
- Status: Beta — shared with 8 friends

## Recent Session (May 23, 2026)
- Trips RLS fix (circular dependency resolved)
- Welcome email dark theme + Georgia font
- PWA setup — manifest, icons, home screen install
- PWA banner triggers after first trip created
- Empty state Lucide icons
- Show/hide password + forgot password flow
- Privacy policy + Terms of Service (vouze.app/privacy.html, vouze.app/terms.html)
- Feedback link in settings
- Auth screen ToS link on signup
- Loading spinner on auth check
- Who's coming input lag fix
- Photo compression on upload (max 1200px, 300KB)
- Download selected/all photos as zip
- Invite flow RLS fix — trip_members UPDATE policy added
- Google OAuth removed for beta
- DateTimePicker — icons on mobile, visible inputs on desktop
- EditItinModal — matches AddItinModal layout, trash delete button

## Known Issues
- Welcome email shows email prefix instead of display name for email/password signups
- Google OAuth removed — re-add after verification

## Roadmap
- Trip invite email notification (before next trip — critical)
- Trip recap / shareable export (key differentiator)
- Push notifications
- Google OAuth full verification
- Privacy policy + ToS in auth screen
- Receipt scanning
- Signed URL photos
- Vouze Pro tier
- React Native

## Parked
- Itinerary item design overhaul
- Past travel companions in Who's Coming
- EditExpenseModal confirm screen cut off