# **TO DO LIST**

> ## **Priorized**
  
None

> ## **Features/Commands**
  
None
> ## **Short Terms**
- [ ] Make a BaseError class. Generalize Errors.
- [ ] Parse output from `Result`
- [ ] Improve errors displaying on `/settings`
- [ ] Add control settings for requests `deleteDuplicate`, `autoAction: { /* Delete requests when 'message' contains */ }`
- [ ] Change RegistryManager to obtain all registries instead of getting upon fetching groups.
- [ ] Unite `DatabaseUtil`, `Statements`, `DatabaseStatementBuilder` and `Client#database`
- [ ] Utilize SQlite transaction. Make "requests bucket" for statements.
- [ ] Handle group type on `/join`
  - [ ] Restricted
  - [x] Protected  
  - [x] Private

> ## **Error Fix**
- [ ] Can't import `ResponseFormatters` in `Util.ts`???
- [ ] /settings failing when converting all validation function to not use Result

> ## **Long Terms**
- [ ] Split commands into mono-functions
- [ ] Throw errors on methods instead of handling it on commands.

> ## **Finished**
- [x] ~~Add `private: boolean` option for `GroupEmbedModal`~~