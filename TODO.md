# **TO DO LIST**

> ## **Priorized**
- [ ] \*Fix\* messages management and how the bot stores messages in groups.

> ## **Features/Commands**
  
None
> ## **Short Terms**
- [ ] Make a BaseError class. Generalize Errors.
- [ ] Parse output from `Result`
- [ ] Add control settings for requests ~~`deleteDuplicate`~~, `autoAction: { /* Delete requests when 'message' contains */ }`
- [ ] Change RegistryManager to obtain all registries instead of getting upon fetching groups.
- [ ] Utilize SQlite transaction. Make "requests bucket" for statements.
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