# tts-app

### Run

```bash
npm i
npm run dev
```

### Translations

To Change the translations, edit the `src/i18n/locales` files.

Wait for the translations to be loaded, then you can change the language in the top right corner of the app.

First, you need to create the translations so then go to use on components. This prevent you to develop with no translations typed.

To use the translations, you can import `useI18nContext` hook from `@/i18n/i18n-react`.

```ts
const { LL } = useI18nContext();
```

Then you can use the translations like this:

```tsx
<span>{LL.helloWorld()}</span>
```

### Husky

```bash
npm run setup:husky
```

Lint staged for test

```json
{
	"**/*.spec.{jsx,tsx}": ["jest --bail --findRelatedTests"]
}
```
