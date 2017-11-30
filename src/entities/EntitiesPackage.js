import EntityDatabase from './EntityDatabase'
import { BibliographicEntry, JournalArticle, Book, Person, Organisation } from './EntityDatabase'
import EntityLabelsPackage from './EntityLabelsPackage'

export default {
  name: 'entities',
  configure(config) {
    config.defineSchema({
      name: 'entities-database',
      version: '1.0.0',
      DocumentClass: EntityDatabase,
      defaultTextType: 'paragraph'
    })
    config.addNode(BibliographicEntry)
    config.addNode(JournalArticle)
    config.addNode(Book)
    config.addNode(Person)
    config.addNode(Organisation)
    config.import(EntityLabelsPackage)
  }
}
