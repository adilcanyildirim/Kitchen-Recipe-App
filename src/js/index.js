
import { clearLoader, elements, renderLoader } from './views/base';
import { search } from 'core-js/fn/symbol';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Search from './models/search';
import Recipe from "./models/Recipe";
import List from './models/list';
import Likes from './models/likes';

//global state of the app
//search obj current recipe obj shopping list obj liked recipe
const state = {};

const controlSearch = async () => {
  //1)get the query from view

  const query = searchView.getInput();
  if (query) {
    // 2)new search object and add to start to state
    state.search = new Search(query);
    //3) prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    //4)search for recipes
    await state.search.getResults();
    //5) render results on UI
    clearLoader();
    searchView.renderResults(state.search.result);

  }
}

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});



elements.searchResPages.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);

  }
});
const controlRecipe = async () => {
  //Get ID from url
  const id = window.location.hash.replace('#', '');


  if (id) {
    // Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);
    //highlight selected search item
    if (state.search) searchView.highlightSelected(id);
    //Create new recipe object 
    state.recipe = new Recipe(id);


    //Get recipe data
    try {
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();
      //Calculate servings and time 
      state.recipe.calcTime();
      state.recipe.calcServings();
      // state.recipe.parseIngredients();

      //render recipe
      clearLoader();
      recipeView.renderRecipe(
        state.recipe,
        state.likes.isLiked(id)
      );
    }
    catch (err) {
      console.log(err);
      alert("error recipe!");
      clearLoader();
    }
  }
}

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener("load",controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//list controller
const controlList = () => {
  //create a new list IF there in none yet
  if (!state.list) state.list = new List();

  //add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  })
}




//LİKE CONTROLLER
const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  //User has not yet liked current recipe
  if (!state.likes.isLiked(currentID)) {

    //add like to the state

    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    //toggle the like button
    likesView.toggleLikeBtn(true);
    //add likes to the UI list
    likesView.renderLike(newLike);
    //user has liked 
  } else {

    //remove like from the state
    state.likes.deleteLike(currentID)
    //toggle the like button
    likesView.toggleLikeBtn(false);
    //remove like from UI list
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
}
//restore liked recipes on page load
window.addEventListener('load', () => {

});

//handle delete and update  button clicks
elements.shopping.addEventListener("click", e => {
  const id = e.target.closest(".shopping__item").dataset.itemid;
  // delete click 
  if (e.target.matches(".shopping__delete,.shopping__delete *")) {

    //delete from state
    state.list.deleteItem(id);
    //delete from UI
    listView.deleteItem(id);

  } else if (e.target.matches(".shopping__count,.shopping__count *")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);

  }
})

//restore liked recipe button clicks

window.addEventListener('load', () => {

  state.likes = new Likes();
  //restore likes
  state.likes.readStorage();

  //toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //render existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

//handling recipe button clicks
elements.recipe.addEventListener("click", e => {
  if (e.target.matches(".btn-decrease,.btn-decrease *")) {
    // description button is clicked
    state.recipe.updateServings("dec");
    recipeView.updateServingsIngredients(state.recipe);

  } else if (e.target.matches(".btn-increase,.btn-increase *")) {
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn,.recipe__btn *")) {
    controlList();

  } else if (e.target.matches(".recipe__love,.recipe__love *")) {
    // like controller
    controlLike();

  }
});


