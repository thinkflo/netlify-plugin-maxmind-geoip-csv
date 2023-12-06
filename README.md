# Netlify Plugin - GraphQL Algolia

A versatile Algolia search plugin to index objects to Algolia as part of the Netlify Build process

A ported version of [gridsome-plugin-algolia](https://github.com/u12206050/gridsome-plugin-algolia) which is originally forked from [gatsby-plugin-algolia](https://github.com/algolia/gatsby-plugin-algolia)

This script has been converted from a Gridsome plugin to an ES6 Module to be run as a Netlify postbuild process



The algoliasearch API methods in this script have been updated to conform to the Version 4 library and has removed the deprecated methods which are contained in the original plugin. Also Promise.allSettled methods have been used to ensure all jobs are completed before processing which would previously cause intermittant errors




You can specify a list of collections to run and how to transform them into an array of objects to index. When you run `netlify build`, it will publish those to Algolia.

Here we have an example with some data that might not be very relevant, but will work with the default configuration.


## Install
* `npm install netlify-plugin-graphql-algolia -S`

Add it to your `netlify.toml` file.  

```toml

[[plugins]]

package = "netlify-plugin-graphql-algolia"
  
# All inputs are optional, so you can omit this section.

# Defaults are shown below.

[plugins.inputs]

# Specifies whether to enable partial updates for the Algolia index. 
# When set to `true`, only modified or new items are updated in the index, 
# enhancing efficiency and reducing operational load.

enablePartialUpdates = true

# Determines the size of each chunk of data sent to Algolia for indexing. 
# A larger chunk size can improve indexing efficiency but may require more 
# memory. The optimal value depends on the size and complexity of your data.

chunkSize = 1000

```

You also require a mandatory `algolia.config.js` in the root of your project which exports a collections array.  See the Setup section on the syntax of this configuration file.


## Setup

First add credentials to a .env file, which you won't commit. If you track this in your file, and especially if the site is open source, you will leak your admin API key. This would mean anyone is able to change anything on your Algolia index.

```
// DEVELOPING: .env.development
// BUILDING: .env.production

ALGOLIA_APP_ID=XXX
ALGOLIA_ADMIN_KEY=XXX
ALGOLIA_INDEX_NAME=XXX
```

## Usage

```javascript:title=algolia-config.js
// algolia-config.js

export const collections = [
  {
    query: `{
      allBlogPost {
        edges {
          node {
            id
            title
            slug
            modified
          }
        }
      }
    }`,
    transformer: ({ data }) => data.allBlogPost.edges.map(({ node }) => node),
    indexName: process.env.ALGOLIA_INDEX_NAME || 'posts', // Algolia index name
    itemFormatter: (item) => {
      return {
        objectID: item.id,
        title: item.title,
        slug: item.slug,
        modified: String(item.modified)
      }
    }, // optional
    matchFields: ['slug', 'modified'], // Array<String> required with PartialUpdates
  },
];
```


### Partial Updates

By default all items will be reindexed on every build. To enable only indexing new, changed and deleted items, set `enablePartialUpdates` to `true` in netlify.toml and make sure `matchFields` in the collections is correct for every collection.

## QnA

**Q** Partial updates not working? All items being reindexed everytime.

**A**
* Make sure that the fields you use to compare are either `Strings` or `Numbers`. *Dates* for example are converted to String when pushed to Algolia so they won't match unless you first convert the Date to a string eg.
* Make sure each object has a unique `id` that you map to `objectID`

```
    itemFormatter: (item) => {
      return {
        objectID: item.id, // Unique id
        title: item.title,
        slug: item.slug,
        modified: String(item.modified) // Date converted to string
      }
    }
```