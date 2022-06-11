# **TO DO LIST**

> ## **Priorized**
- [ ] \*Fix\* messages management and how the bot stores messages in groups.
- [ ] Fix settings options
- [ ] Rework on pagination.
- [ ] Refactor error handling on all commands and event handlers

> ## **Features/Commands**
- [ ] Improve /help to parse options

> ## **Short Terms**
- [ ] Make a BaseError class. Generalize Errors.
- [ ] Parse output from `Result`
- [ ] Add control settings for requests ~~`deleteDuplicate`~~, `autoAction: { /* Delete requests when 'message' contains */ }`
- [ ] Utilize SQlite transaction. 
- [ ] Log channel for group update.
- [ ] Setting type: 'list'

> ## **Error Fix**
- [ ] Can't import `ResponseFormatters` in `Util.ts`???


> ## **Long Terms**
- [ ] Split commands into mono-functions
- [ ] Throw errors on methods instead of handling it on commands.
- [ ] Migrate to PostgreSQL

> ## **Finished**
- [x] ~~Handle group type on `/join`~~
  - [x] ~~Restricted~~
  - [x] ~~Protected~~
  - [x] ~~Private~~
- [x] ~~Add `private: boolean` option for `GroupEmbedModal`~~
- [x] ~~/settings failing when converting all validation function to not use Result~~
- [x] Improve errors displaying on `/settings`
- [x] ~~Unite `DatabaseUtil`, `Statements`, `DatabaseStatementBuilder` and `Client#database`~~