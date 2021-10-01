"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show form for adding a new story */
function navSubmitClick(evt) {
  console.debug("navSubmitStory",evt);
  hidePageComponents();
  $postForm.show();
};

$body.on("click","#nav-story",navSubmitClick);
$body.on("click","#story-submit",addStoryToPage); //Add new story to page

/** Show favorite stories when user clicks on Favorites **/

function navFavoritesClick(evt) {
  console.debug("navFavorites");
  hidePageComponents();
  putFavoritesOnPage(currentUser);
}

$body.on("click",'#nav-favorites',navFavoritesClick);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick");
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}
