"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  console.debug("generateStoryMarkup");

  const hostName = story.getHostName();
  const storyElement = $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
  const favoriteIcon = getFavoriteIcon(story);
  if (currentUser){
    if (checkIsUsersStory(story.storyId)){
      const removeButton = getRemoveButton(story);
      const editButton = getEditButton(story);
      storyElement[0].prepend(removeButton);
      storyElement[0].append(editButton);
    };
  };
  storyElement[0].prepend(favoriteIcon);
  return storyElement;
};

/** Determines favorite icon to display **/
function getFavoriteIcon(story) {
  const favoriteIcon = document.createElement("span");
  if (currentUser) {
    const isFavorite =  checkUserFavorite(story.storyId);
    favoriteIcon.innerHTML = `&#x2665`;
    favoriteIcon.classList.add("favIcon");
    favoriteIcon.addEventListener("click", async function(evt) {
        await handleIconClick(evt,story);
    });
    if (isFavorite) {
      favoriteIcon.classList.add("active");
    }
  };
  return favoriteIcon;
};

/**  Checks if story is in user's favorites */
function checkUserFavorite(storyId) {
  for (let {storyId: favoritedStoryId} of currentUser.favorites){
    if (storyId === favoritedStoryId) {
      return true;
    };
  };
  return false;
};

/** Handler for favorite icon being clicked */
async function handleIconClick(evt,story) {
    evt.target.classList.toggle("active");
    const isFavorite = checkUserFavorite(story.storyId);
    if (isFavorite) {
      await currentUser.removeFromFavorites(story);
    } else {
      await currentUser.addToFavorites(story);
    };
};

/** Creates a Remove Button for a story **/
function getRemoveButton(story) {
  const removeButton = document.createElement("span");
  removeButton.innerHTML = "&#216";
  removeButton.classList.toggle("delete");
  removeButton.addEventListener("click", async function(evt) {
    await handleRemoveClick(evt,story);
  });
  return removeButton;
};

/** Creates an Edit button for a story */
function getEditButton(story) {
  const editButton = document.createElement("span");
  editButton.innerText = "Edit";
  editButton.classList.toggle("edit");
  editButton.addEventListener("click", function(evt) {
    handleEditClick(evt,story);
  });
  return editButton;
};

/** Determines if story is owned by User */
function checkIsUsersStory(storyId) {
  for (let {storyId: usersStoryId} of currentUser.ownStories) {
    if (storyId === usersStoryId) {
      return true;
    };
  };
  return false;
};

/** Handler for remove button being clicked */
async function handleRemoveClick(evt,story) {
  const isUsersStory = checkIsUsersStory(story.storyId);
  if (isUsersStory){
    evt.target.parentElement.remove();
    await storyList.removeStory(story);
  };
};

/** Handler for edit button being clicked */
function handleEditClick(evt,story) {
  $updateForm.show();
  console.log($("#story-update-author"));
  $("#story-update-author")[0].value = story.author;
  $("#story-update-title")[0].value = story.title;
  $("#story-update-url")[0].value = story.url;
  $updateForm.data.storyId = story.storyId;
};

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
};

/** Gets list of favorites from user, generates their HTML, and puts on page */

function putFavoritesOnPage(user) {
  console.debug("putFavoritesOnPage");
  $allStoriesList.empty();
  for (let story of user.favorites) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  };

  $allStoriesList.show();
};

async function addStoryToPage(evt) {
  evt.preventDefault();
  console.debug("addStoryToPage");
  const {author,title,url} = {
    author: $('#story-author')[0].value, 
    title: $('#story-title')[0].value, 
    url: $('#story-url')[0].value,
  };
  const newStory = await storyList.addStory(currentUser,{author,title,url});
  const $story = generateStoryMarkup(newStory);
  storyList.stories.unshift(newStory);
  $allStoriesList.prepend($story);
  $postForm.hide();
  $allStoriesList.show();
};

/** Handler for when a story update is submitted */

async function submitEdit(evt) {
  console.debug("submitEditStory",evt);
  const storyToUpdate = $("#update-form").data.storyId;
  const {author,title,url} = {
    author: $('#story-update-author')[0].value, 
    title: $('#story-update-title')[0].value, 
    url: $('#story-update-url')[0].value,
  };
  storyList.updateStory({storyId: storyToUpdate, author, title, url});
  for (let i=0; i<storyList.stories.length; i++) {
    if (storyToUpdate === storyList.stories[i].storyId){
      storyList.stories[i].author = author;
      storyList.stories[i].title = title;
      storyList.stories[i].url = url;
    };
  }
  $updateForm.hide();
  hidePageComponents();
  putStoriesOnPage();
};

$body.on("click","#story-update-submit",submitEdit);