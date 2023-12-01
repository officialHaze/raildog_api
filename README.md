# Raildog
Indian Railway status provider

## To test the API, follow the below instructions

First, clone the git repository in your root workspace and cd into it:
```git
git clone https://github.com/officialHaze/raildog_api.git
cd raildog_api
```

Once inside the directory create a .env file
      ```
      touch .env
      ```
to set the environment(NODE_ENV).
       ```
       NODE_ENV=dev
       ```
       
The API will be tested in a dev environment

There are other env variables that need to be set, if you really want to test the API,
contact me at
      ```
      moinak.dey8@gmail.com
      ```
with the subject
      ```
      Raildog Test ENV
      ```
and I will get back to you as soon as possible.

Second, install all the dependencies:
```npm
npm install
```

NOTE: This API has been written in typescript, and the build folder is not included, so make sure you have typescript installed globally
      or you can simply install it for the current project as a devDependency by typing the following command:
      ```
      npm install-D typescript
      ```

Third, you can run the server by typing:
```npm
npm run dev
```
