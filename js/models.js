"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // UNIMPLEMENTED: complete this function!
    return "hostname.com";
  }

  async removeStory() {
    console.debug("removeStory");
    const response = await axios({
      url: `${BASE_URL}/stories/${this.storyId}`,
      method: "DELETE",
      data: { 
        token: currentUser.loginToken,
      },
    });
    console.log(response);
    currentUser = await User.loginViaStoredCredentials(currentUser.loginToken, currentUser.username);

  };
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory( {username}, {title,author,url}) {
    console.debug("addStory");
    const { data: {story} } = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: { 
        token: currentUser.loginToken,
        story: {
          author,
          title,
          url
        } 
      },
    });
    currentUser = await User.loginViaStoredCredentials(currentUser.loginToken, currentUser.username);
    return new Story(story);
  }

  /** Update story data in API */
  async updateStory({storyId, author, title, url}) {
    console.debug("updateStory");
    console.log({storyId, author, title, url})
    const { data: {story} } = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "PATCH",
      data: { 
        token: currentUser.loginToken,
        story: {
          author,
          title,
          url,
        }
      },
    });
    currentUser = await User.loginViaStoredCredentials(currentUser.loginToken, currentUser.username);
  };

  /** Remove story from API */
  async removeStory(story) {
    console.debug("removeStory");
    const response = await axios({
      url: `${BASE_URL}/stories/${story.storyId}`,
      method: "DELETE",
      data: { 
        token: currentUser.loginToken,
      },
    });
    const storyIndex = this.findIndexOfStory(story);
    if (storyIndex !== -1) {
      this.stories.splice(storyIndex,1);
    }
    currentUser = await User.loginViaStoredCredentials(currentUser.loginToken, currentUser.username);
  };

  findIndexOfStory(story) {
    for (let i=0; i<this.stories.length; i++){
      if (story.storyId === this.stories[i].storyId) {
        return i;
      };
    };
    return -1;
  };
};


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    }).catch((error) => {
      if (error.response.status === 409) {
        $usernameTakenError.show();
        throw(error);
      };
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  };

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    }).catch( (error) => {
      $invalidCredentialsError.show();
      throw(error);
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  async addToFavorites(story) {
    console.debug("addToFavorites");
    const response = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: "POST",
      data: { token: this.loginToken }
    });
    currentUser = await User.loginViaStoredCredentials(this.loginToken, this.username);
  };

  async removeFromFavorites(story) {
    console.debug("removeFromFavorites",story);
    const response = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: "DELETE",
      data: { token: this.loginToken }
    });
    currentUser = await User.loginViaStoredCredentials(this.loginToken, this.username);
  };
}
