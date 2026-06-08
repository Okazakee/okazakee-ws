# Graph Report - okazakee-ws  (2026-06-08)

## Corpus Check
- 141 files · ~78,103 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1621 nodes · 2541 edges · 66 communities (56 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `99ee3803`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]

## God Nodes (most connected - your core abstractions)
1. `common` - 58 edges
2. `common` - 58 edges
3. `career` - 56 edges
4. `portfolio` - 56 edges
5. `career` - 56 edges
6. `portfolio` - 56 edges
7. `blog` - 50 edges
8. `blog` - 50 edges
9. `getAdminClient()` - 45 edges
10. `users` - 39 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `NotFound()`  [INFERRED]
  src/app/[locale]/layout.tsx → src/app/[locale]/[post_type]/[id]/[title]/not-found.tsx
- `CMS()` --calls--> `useLayoutStore`  [EXTRACTED]
  src/app/[locale]/cms/page.tsx → src/store/layoutStore.ts
- `Page()` --calls--> `NotFound()`  [INFERRED]
  src/app/[locale]/[post_type]/[id]/[title]/page.tsx → src/app/[locale]/[post_type]/[id]/[title]/not-found.tsx
- `AccountSection()` --calls--> `useLayoutStore`  [EXTRACTED]
  src/components/common/cms/AccountSection.tsx → src/store/layoutStore.ts
- `SidePanel()` --calls--> `useLayoutStore`  [EXTRACTED]
  src/components/common/cms/SidePanel.tsx → src/store/layoutStore.ts

## Communities (66 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (31): For --cluster-only, For git commit hook, For /graphify add, For /graphify explain, For /graphify path, For /graphify query, For native CLAUDE.md integration, For --update (incremental re-extraction) (+23 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (115): batchPublishBlog(), blogActions(), BlogOperation, BlogResult, createBlog(), CreateBlogData, deleteBlog(), getAuthors() (+107 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (16): 10. Error Handling, 11. Comments and Docstrings, 12. Testing, 13. Git, 14. Dependencies and Tooling, 15. Red Lines, 1. Overview, 2. Repository Structure (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (80): BlogFormData, BlogSection(), EditablePost, emptyForm, FormMode, CareerFormData, CareerSection(), EditableCareerEntry (+72 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (64): getCurrentViews(), incrementViews(), GET(), AccountSection(), deleteMyAccount(), getAdminClient(), buildCmsUser(), CMSBootData (+56 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (58): common, add, adding, allChangesPublished, apply, applyChanges, applying, cancel (+50 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (58): common, add, adding, allChangesPublished, apply, applyChanges, applying, cancel (+50 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (56): career, addCareerEntry, careerEntriesTitle, changeLogo, companyDescEnLabel, companyDescItLabel, companyDescPlaceholder, companyLabel (+48 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (56): portfolio, addPortfolioPost, bodyEnLabel, bodyEnPlaceholder, bodyItLabel, bodyItPlaceholder, buttonTextLabel, changeImage (+48 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (56): career, addCareerEntry, careerEntriesTitle, changeLogo, companyDescEnLabel, companyDescItLabel, companyDescPlaceholder, companyLabel (+48 more)

### Community 12 - "Community 12"
Cohesion: 0.04
Nodes (56): portfolio, addPortfolioPost, bodyEnLabel, bodyEnPlaceholder, bodyItLabel, bodyItPlaceholder, buttonTextLabel, changeImage (+48 more)

### Community 13 - "Community 13"
Cohesion: 0.04
Nodes (50): blog, addBlogPost, bodyEnLabel, bodyEnPlaceholder, bodyItLabel, bodyItPlaceholder, buttonTextLabel, changeImage (+42 more)

### Community 14 - "Community 14"
Cohesion: 0.04
Nodes (50): blog, addBlogPost, bodyEnLabel, bodyEnPlaceholder, bodyItLabel, bodyItPlaceholder, buttonTextLabel, changeImage (+42 more)

### Community 15 - "Community 15"
Cohesion: 0.19
Nodes (10): IdleHandle, IdleWindow, Providers(), ThemeProvider(), LegacyMediaQueryList, ThemeToggle(), LegacyMediaQueryList, ThemeMode (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (42): browserslist, development, production, dependencies, blurkit, lucide-react, markdown-to-jsx, next (+34 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (41): noLabelWithoutControl, noStaticElementInteractions, useButtonType, source, assist, actions, noExcessiveCognitiveComplexity, noExcessiveLinesPerFunction (+33 more)

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (39): users, adding, addNewUserTitle, addUser, adminRequired, allowedUsersTitle, cannotDemoteLastAdmin, confirmRemoveUser (+31 more)

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (39): users, adding, addNewUserTitle, addUser, adminRequired, allowedUsersTitle, cannotDemoteLastAdmin, confirmRemoveUser (+31 more)

### Community 20 - "Community 20"
Cohesion: 0.06
Nodes (34): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+26 more)

### Community 21 - "Community 21"
Cohesion: 0.06
Nodes (32): hero, aboutMeParagraphLabel, aboutMeParagraphPlaceholder, aboutMeSection, aboutMeTitleLabel, aboutMeTitlePlaceholder, chooseImage, copyUrl (+24 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (32): hero, aboutMeParagraphLabel, aboutMeParagraphPlaceholder, aboutMeSection, aboutMeTitleLabel, aboutMeTitlePlaceholder, chooseImage, copyUrl (+24 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (12): ErrorDiv(), InnerHtml(), InnerHtmlProps, Career(), CareerEntry, CareerClient(), Hero(), Skills() (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (11): AppleIcon(), GithubIcon(), IconProps, LinkedinIcon(), ResumeButtonProps, Contacts(), BlogFormData, PortfolioFormData (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (15): Tags(), BlogPreview(), BlogPreviewProps, CareerPreview(), HeroPreview(), HeroPreviewProps, PortfolioPreview(), PortfolioPreviewProps (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.09
Nodes (23): account, clickToUpload, confirmDeleteButton, confirmDeleteDesc, confirmDeleteTitle, dangerZoneDesc, dangerZoneTitle, deleteAccount (+15 more)

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (23): skills, addCategory, addSkill, categoryNamePlaceholder, categoryNamesLabel, categoryTranslationPlaceholder, confirmDeleteCategory, errorCategoryName (+15 more)

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (23): account, clickToUpload, confirmDeleteButton, confirmDeleteDesc, confirmDeleteTitle, dangerZoneDesc, dangerZoneTitle, deleteAccount (+15 more)

### Community 29 - "Community 29"
Cohesion: 0.09
Nodes (23): skills, addCategory, addSkill, categoryNamePlaceholder, categoryNamesLabel, categoryTranslationPlaceholder, confirmDeleteCategory, errorCategoryName (+15 more)

### Community 30 - "Community 30"
Cohesion: 0.17
Nodes (14): ClientMarkdown(), FormattedDate(), FormattedDateProps, SkillsCarousel(), CareerClientProps, CareerEntry, CareerPreviewProps, PreviewCareerEntry (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (21): searchPosts(), sitemap(), PostsSection(), generateMetadata(), generateStaticParams(), Page(), validPostTypes, applySupabaseCacheLife() (+13 more)

### Community 32 - "Community 32"
Cohesion: 0.19
Nodes (19): BOT_PROBE_PATTERNS, createRedirectResponse(), createRewriteResponse(), extractLocaleFromPath(), getPreferredLocale(), handleAuthError(), handleI18n, handleMiddlewareError() (+11 more)

### Community 33 - "Community 33"
Cohesion: 0.11
Nodes (19): layout, footerButtonTitleLabel, footerDarkModeLabel, footerLeftLabel, footerLightModeLabel, footerMiddleLabel, footerPrivacyPolicyLabel, footerRightLabel (+11 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (19): account, blog, career, contacts, hero, layout, portfolio, privacy-policy (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (19): layout, footerButtonTitleLabel, footerDarkModeLabel, footerLeftLabel, footerLightModeLabel, footerMiddleLabel, footerPrivacyPolicyLabel, footerRightLabel (+11 more)

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (19): account, blog, career, contacts, hero, layout, portfolio, privacy-policy (+11 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (16): contacts, addNewContact, iconNameLabel, iconNamePlaceholder, labelFieldLabel, labelPlaceholder, linkLabel, linkPlaceholder (+8 more)

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (16): contacts, addNewContact, iconNameLabel, iconNamePlaceholder, labelFieldLabel, labelPlaceholder, linkLabel, linkPlaceholder (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (15): 🏗️ Architecture, 📖 CMS Usage, 🤝 Contributing, 🚀 Deployment, 🎨 Development, 🔐 Environment Variables, 🚀 Features, 🚦 Getting Started (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.36
Nodes (4): ImageModal(), ImageModalProps, useZoom(), NextImageProps

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (8): AppLocale, isValidLocale(), locales, routing, ConditionalFooterProps, LocaleShell(), whiteRabbit, getTranslationsSupabase()

### Community 43 - "Community 43"
Cohesion: 0.11
Nodes (18): page, authError, cmsDashboard, initError, sectionLabels, settingsComingSoon, settingsTitle, account (+10 more)

### Community 44 - "Community 44"
Cohesion: 0.11
Nodes (18): page, authError, cmsDashboard, initError, sectionLabels, settingsComingSoon, settingsTitle, account (+10 more)

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (9): PreChild, PreCustomProps, RootLayout(), PostsPage(), descriptions, PrivacyPolicyPage(), titles, NotFound() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (10): deepMerge(), getI18nData(), i18nActions(), I18nOperation, I18nResult, mergeSectionTranslations(), UpdateI18nData, updateSectionTranslations() (+2 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (8): privacy, confirmCancel, errorFetch, errorSave, saveChanges, subtitle, successSave, title

### Community 49 - "Community 49"
Cohesion: 0.25
Nodes (8): privacy, confirmCancel, errorFetch, errorSave, saveChanges, subtitle, successSave, title

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (6): CONFIG_ITEMS, CONTENT_ITEMS, MenuItem, SidePanel(), SidePanelProps, createClient()

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): isrRevalidation, nextConfig, withNextIntl

## Knowledge Gaps
- **1112 isolated node(s):** `config`, `config`, `name`, `version`, `private` (+1107 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `blog` connect `Community 14` to `Community 42`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `career` connect `Community 11` to `Community 42`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `portfolio` connect `Community 12` to `Community 42`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `config`, `config`, `name` to the rest of the system?**
  _1112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05037984806077569 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._