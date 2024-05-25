/* -------------------------------------------------------------------------- */
/*                                   OBJECTS                                  */
/* -------------------------------------------------------------------------- */
const typeColors = {
  //colors for our poke-info corresponding to type
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#ffeea8" /* "#F8D030" */,
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};
const statNameMapping = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SATK",
  "special-defense": "SDEF",
  speed: "SPD",
};

/* -------------------------------------------------------------------------- */
/*                              GLOBAL FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

function inchesToFeet(inches) {
  let feet = Math.floor(inches / 12);
  let inchesLeft = Math.round(inches % 12);
  return `${feet}'${inchesLeft}"`;
}
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
function hexToRGB(hexColor) {
  return [
    parseInt(hexColor.slice(1, 3), 16),
    parseInt(hexColor.slice(3, 5), 16),
    parseInt(hexColor.slice(5, 7), 16),
  ].join(",");
}
function getEnglishFlavorText(pokemonSpecies) {
  let filtered = pokemonSpecies["flavor_text_entries"]
    .filter((entry) => entry.language.name === "en")
    .map((entry) => entry.flavor_text.replace(/\f/g, " "));
  console.log(filtered);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function extractEvolutionNames(evolutionChainData) {
  const names = [];
  let mainChain = evolutionChainData.chain; //main chain
  let currentChain = evolutionChainData.chain; //start chain

  let mainEvolveTo = evolutionChainData.chain.evolves_to;
  names.push(mainChain.species.name); //starter pokemon evo
  mainEvolveTo.map((evolveTo) => {
    currentChain = evolveTo;
    while (currentChain) {
      console.log("currentChain", currentChain);
      console.log("currentChain.species.name", currentChain.species.name);
      if (currentChain.species.name)
        /* arr.push(currentChain.species.name) */ names.push(
          currentChain.species.name
        );

      currentChain = currentChain.evolves_to[0];
    }
  });
  console.log('extracted evolution names: ', names);
  return names;
}

/* -------------------------------------------------------------------------- */
/*                               POKEMON SEARCH                               */
/* -------------------------------------------------------------------------- */

document.querySelector('#pokedex-start').addEventListener('click', () => {
  document.querySelector('#pokemon-info').style.clipPath = 'inset(0 0 0 0)';
  document.querySelector('#pokedex-wrapper-top').style.top = '58px';
  document.querySelector('#pokedex-wrapper-bottom').style.bottom = '58px';
  document.querySelector("#pokedex-start").classList.add('fade');

  setTimeout(() => {
    searchUI();
    document.querySelector('body > div').removeChild(document.querySelector("#pokedex-start"));
    document.querySelector('#poke-input').focus(); //preclick on input
  }, 1000);

})

function searchUI() {
  const pokeString = document.querySelector("#pokemon-info > div");
  if (pokeString.classList.contains("fade")) {
    pokeString.classList.remove("fade");
  }
  pokeString.innerHTML = `
    <div class="input-wrapper fade-in">
    <input type="text" name="" value="" placeholder="enter name or id" id="poke-input" autocomplete="off" spellcheck="false"/>
    <button type="button" name="button" id="get-pokemon">
      Who's That Pokemon?!
    </button>
    <div class="error"></div>
    </div>
  `;
  pokeString.style.justifyContent = 'center';
  pokeString.querySelector("#get-pokemon").addEventListener("click", (event) => {
    event.preventDefault();
    getPokemon();
  });
  pokeString.querySelector("#poke-input").addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      getPokemon();
    }
  })
}

/* -------------------------------------------------------------------------- */
/*                            GET POKEMON FROM API                            */
/* -------------------------------------------------------------------------- */
async function getPokemon(specifiedValue = null) {
  let value = specifiedValue || document.querySelector("input").value.toLowerCase();
  const pokemonURL = `https://pokeapi.co/api/v2/pokemon/${value}`;
  const speciesURL = `https://pokeapi.co/api/v2/pokemon-species/${value}`;
  
  let validValue = true;
  Promise.all([
    fetch(pokemonURL).then((res) => res.json()),
    fetch(speciesURL).then((res) => res.json()),
  ])
    .then(async ([pokemonData, speciesData]) => {
      console.log(pokemonData.sprites.other["official-artwork"].front_default);
      // Process the evolution chain
      const evolutionChainURL = speciesData.evolution_chain.url;
      const evolutionChainData = await fetch(evolutionChainURL).then((res) =>
        res.json()
      );
      const evolutionNames = extractEvolutionNames(evolutionChainData);
      console.log(evolutionNames);
      // Fetch additional data for each Pokémon in the evolution chain
      const evolutionDataPromises = evolutionNames.map((name) => {
        return fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then((res) =>
          res.json()
        )
        .catch((error) =>{ //certain pokemon names are not part of the api call, cannot call data from the evolution line
          console.error("Fetch error:", error);
          return fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonData.name}`).then((res) =>
            res.json()
          )
        })
      });

      const evolutionData = await Promise.all(evolutionDataPromises);
      console.log(evolutionData);
      evolutionData.map((data) => {
        console.log(data);
      });
      const pokemon = {
        name: pokemonData.name,
        id: pokemonData.id,
        image: pokemonData.sprites.other["official-artwork"].front_default,
        shiny: pokemonData.sprites.other["official-artwork"].front_shiny,
        cry: pokemonData.cries.latest,
        type: pokemonData.types.map((type) => type.type.name),
        weight: `${Math.round((pokemonData.weight / 4.536) * 100) / 100} lbs`, //hectogram to pounds
        height: `${inchesToFeet(pokemonData.height * 3.937)} in`, //decimeters to inches
        abilities: pokemonData.abilities
          .map((index) => index.ability.name)
          .join(", "),
        stats: {
          name: pokemonData.stats.map((stat) => stat.stat.name),
          base: pokemonData.stats.map((stat) => stat.base_stat),
        },
        heldItem: pokemonData.held_items
          .map((item) => item.item.name)
          .join(","),
        moves: pokemonData.moves
          .map(
            (move) =>
              capitalizeFirstLetter(
                move.move.name
              ) /* move.move.name[0].toUpperCase() + move.move.name.slice(1) */
          )
          .join(", "),
        description: getEnglishFlavorText(speciesData),
        evolutions: evolutionData.map((data) => ({
          name: data.name,
          id: data.id,
          image: data.sprites.other["official-artwork"].front_default,
        })),
      };

      if (validValue){
        if (document.querySelector(".input-wrapper")) {
          document.querySelector("#pokemon-info > div").style.justifyContent = "flex-start";
          document.querySelector("#pokemon-info > div").removeChild(document.querySelector(".input-wrapper"));
        }
      }

      console.log(pokemon.evolutions);
      displayPokemon(pokemon);

      
    })
    .catch((error) => {
      validValue = false;
      if(document.querySelector('.error')){
        // Clear the input field
        /* document.querySelector("input").value = ""; */
        document.querySelector(".error").innerText = `**Could not find pokemon**`;
      }
      console.error("Error:", error)
    });
    
}
function initializePokedexUI(){
   const pokeString = document.querySelector("#pokemon-info > div");
   pokeString.innerHTML = `
    <div class="pokeball-anim-wrap pulse">
      <div class="pokeball-anim multiple fade-out2"></div>
      <div class="pokeball-anim multiple fade-out"></div>
      <div class="pokeball-anim spin"></div>
    </div>
    <div class="sticky">
      <div id="poke-circle" class="circle pulse"></div>
      <img class="image pulse-bright-fade-in" src="${/* pokemon.image */""}" alt="" />
      <div id="shiny-wrap">
        <img id="poke-shiny" src="${/* pokemon.shiny */""}" alt="" />
        <div id="shiny-border2"></div>
        <!-- Stars and other elements -->
        <div class="star star-1"></div>
        <div class="star star-2"></div>
        <div class="star star-3"></div>
        <div class="star star-4"></div>
        <div class="star star-5"></div>
        <div class="star star-6"></div>
        <div class="star star-7"></div>
        <div class="star star-8"></div>
        <div class="star star-9"></div>
        <div class="star star-10"></div>
        <div class="star star-11"></div>
      </div>
      <div id="poke-name" class="fade-down"></div>
    </div>
    <section class="clip-scroller">
      <section class="type-wrapper">
        ${/*<!-- Types will be dynamically added here -->*/ ""}
      </section>
      <section class="description-wrapper">
        <p>${/* pokemon.description */ ""}</p></section>
      <section class="about-wrapper">
        <section class="about-wrapper-wrapper">
          <h3>Weight</h3>
          <p id="weight">
            <span class="material-symbols-rounded">weight</span>
            <span>${/* pokemon.weight */ ""}</span>
          </p>
        </section>
        <section class="about-wrapper-wrapper">
          <h3>Height</h3>
          <p id="height">
          <span class="material-symbols-rounded">height</span> 
          <span>${/* pokemon.height */ ""}</span>
          </p>
        </section>
        <section class="about-wrapper-wrapper span-two">
          <h3>Abilities</h3>
          <p id="abilities">${/* pokemon.abilities */ ""}</p>
        </section>
      </section>
      <section class="stats-wrapper">
        ${/* <!-- Stats will be dynamically added here --> */""}
      </section>
      <section class="evolution">
        ${/* <!-- Evolutions will be dynamically added here --> */""}
      </section>
    </section>
    <audio id="pokemon-cry">
      <source src="${/* pokemon.cry */ ""}" type="audio/mpeg" />
    </audio>
  `;
  
}

function updatePokemonUI(pokemon){
  //Dynamically add image
  const pokeImage = document.querySelector(".sticky .image");
  const pokeShiny = document.querySelector("#poke-shiny");
  pokeImage.src = pokemon.image;
  pokeShiny.src = pokemon.shiny;

  //Dynamically add name and ID of the pokemon
  const pokeName = document.querySelector("#poke-name");
  console.log(pokeName.textContext);
  pokeName.innerHTML= `${pokemon.name.toUpperCase()} <span id="poke-id">#${pokemon.id}</span>`

  // Dynamically add types
  const pokeTypeWrapper = document.querySelector(".type-wrapper");
  pokeTypeWrapper.innerHTML = 
  pokemon.type
    .map((type) => `<p class="type">${capitalizeFirstLetter(type)}</p>`)
    .join("");

  // Dynamically add description
  const pokeDescription = document.querySelector(".description-wrapper p");
  pokeDescription.textContent = pokemon.description;

  // Dynamically add about details
  const pokeWeight = document.querySelector(
    ".about-wrapper #weight > span:nth-child(2)"
  );
  const pokeHeight = document.querySelector(
    ".about-wrapper #height > span:nth-child(2)"
  );
  const pokeAbilities = document.querySelector(".about-wrapper #abilities");
  pokeWeight.textContent = pokemon.weight;
  pokeHeight.textContent = pokemon.height;
  pokeAbilities.textContent = pokemon.abilities;

  //Dynamically add stats
  const pokeStats = document.querySelector(".stats-wrapper");
  console.log(pokemon.stats);
  pokeStats.innerHTML = 
  '<h3>Stats</h3>' +
  Array.from(
    { length: pokemon.stats.base.length },
    (_, i) =>
      `<section class="stats-wrapper-wrapper">
        <span>${statNameMapping[pokemon.stats.name[i]]}</span>
        <span>${pokemon.stats.base[i]}</span>
        <progress value="${
          pokemon.stats.base[i]
        }" max="100" class="progress-bar"></progress>
      </section>`
    ).join("");

  //Dynamically add evolutions
  const pokeEvolutions = document.querySelector(".evolution");
  if (pokemon.evolutions.length > 1) {
    pokeEvolutions.innerHTML = `
    <h3>Evolutions</h3>
      <section class="evolution-wrapper">
        ${pokemon.evolutions
          .map(
            (evo) => `
          <section class="evolution-wrapper-wrapper">
            <img class="image" src="${evo.image}" alt="" />
            <section class="evolution-info">
              <span>${capitalizeFirstLetter(evo.name)}</span>
              <span>#${evo.id}</span>
            </section>
          </section>
        `
          )
          .join("")}
      </section>
    `;
    
    document.querySelectorAll(".evolution-wrapper-wrapper > .image").forEach((img, i) => {
      img.addEventListener("click", () => {
        getPokemon(pokemon.evolutions[i].name);
      });
    })

  } else {
    pokeEvolutions.innerHTML =
      "<h3>Evolutions</h3><section>Does not evolve</section>";
  }

  //Dynamically add audio
  const pokeCry = document.querySelector("#pokemon-cry");
  pokeCry.src = pokemon.cry;
}
let value = 0;


function displayPokemon(pokemon) {
  value = pokemon.id;
  console.log(pokemon);
  //remove any children from pokemon-info, if any, to reset
  /* if (document.querySelector("#pokemon-info").hasChildNodes()) {
    document
      .querySelector("#pokemon-info")
      .replaceChildren([]);
  } */
  /* const pokeString = document.createElement("div"); */
  const pokeString = document.querySelector("#pokemon-info > div");
  /* if(pokeString.classList.contains('fade')){
    pokeString.classList.remove('fade');
  } */
  console.log(pokeString.innerHTML.trim() === "");
  if (pokeString.innerHTML.trim() == "") { //if pokeString is empty, we have to initialize and add the interface
    document.querySelector(".interface").innerHTML = `
    <span class="material-icons-round left-arrow">play_arrow</span>
    <span id="shiny" class="material-icons-round">star</span>
    <span class="material-symbols-rounded search">search</span>
    <span class="material-icons-round sound">volume_up</span>
    <span class="material-icons-round right-arrow">play_arrow</span>
    `;
    const interface2 = document.createElement("section");
    interface2.innerHTML = `
    <section id="auto-scroller">
      <span class="scroll-arrows arrow-1"></span>
      <span class="scroll-arrows arrow-2"></span>
      <span class="scroll-arrows arrow-3"></span>
    </section>
  `;
    document.querySelector("#pokemon-info").appendChild(interface2);
    initializePokedexUI();
    addLeftListener();
    addRightListener();
    addShinyListener();
    addSearchListener();
    addSoundListener();
    addClipScrollListener();
    addAutoScrollInterfaceListener();
  }
  updatePokemonUI(pokemon);

  /* ------------------------------------------------------------------------ */
  /*                    NAVIGATION LEFT AND RIGHT CAROUSEL                    */
  /* ------------------------------------------------------------------------ */

  function addLeftListener() {
    document.querySelector('.left-arrow').addEventListener("click", () => {
      value-= 1;
      getPokemon(value);
    });
  }

  function addRightListener() {
    document.querySelector('.right-arrow').addEventListener("click", () => {
      value+= 1;
      getPokemon(value);
    });
  }
  /* ------------------------------------------------------------------------ */
  /*                              SHINY ANIMATION                             */
  /* ------------------------------------------------------------------------ */
  // Function to add the event listener to #shiny
  function addShinyListener() {
    document.querySelector("#shiny").addEventListener("click", () => {
    document.querySelector("#shiny").classList.toggle("gold");
    console.log(document.querySelector("#poke-shiny"));
    document
      .querySelector("#poke-shiny")
      .classList.toggle("clip-path-circle-50");
    //document.querySelector('#shiny-border1').classList.toggle('expand-shiny-border-20');
    document
      .querySelector("#shiny-border2")
      .classList.toggle("expand-shiny-border-10");
    if (pokemon.id > 889) {
      //images from api are mismatched on positioning
      document.querySelector(".sticky > img").classList.toggle("hidden");
    }
    document.querySelector(".star-1").classList.toggle("star-1-move");
    document.querySelector(".star-2").classList.toggle("star-2-move");
    document.querySelector(".star-3").classList.toggle("star-3-move");
    document.querySelector(".star-4").classList.toggle("star-4-move");
    document.querySelector(".star-5").classList.toggle("star-5-move");
    document.querySelector(".star-6").classList.toggle("star-6-move");
    document.querySelector(".star-7").classList.toggle("star-7-move");
    document.querySelector(".star-8").classList.toggle("star-8-move");
    document.querySelector(".star-9").classList.toggle("star-9-move");
    document.querySelector(".star-10").classList.toggle("star-10-move");
    document.querySelector(".star-11").classList.toggle("star-11-move");
    document.querySelector(".star-1").classList.toggle("fade");
    document.querySelector(".star-2").classList.toggle("fade");
    document.querySelector(".star-3").classList.toggle("fade");
    document.querySelector(".star-4").classList.toggle("fade");
    document.querySelector(".star-5").classList.toggle("fade");
    document.querySelector(".star-6").classList.toggle("fade");
    document.querySelector(".star-7").classList.toggle("fade");
    document.querySelector(".star-8").classList.toggle("fade");
    document.querySelector(".star-9").classList.toggle("fade");
    document.querySelector(".star-10").classList.toggle("fade");
    document.querySelector(".star-11").classList.toggle("fade");
    if (document.querySelector("#shiny").classList.contains("gold")) {
      document.querySelector("#pokemon-shiny-sound").play();
    }
    });
  }
  
  /* ------------------------------------------------------------------------ */
  /*                                  SEARCH                                  */
  /* ------------------------------------------------------------------------ */
  function addSearchListener() {
    document.querySelector(".search").addEventListener("click", () => {
      document.querySelector(".search").style.color = "rgb(132, 142, 196)";
      document.querySelector('#pokemon-info > div').classList.add('fade');
      document.querySelector('#auto-scroller').classList.add('fade');
      document.querySelector('#pokemon-info').removeChild(document.querySelector('#pokemon-info > section'));
      
      setTimeout(() => {
        document.querySelector("#pokemon-info > div").innerHTML = "";
        searchUI();
        document.querySelector("#poke-input").focus(); //preclick on input
      }, 500);
      
    });
  }

  
  /* ------------------------------------------------------------------------ */
  /*                             PLAY POKEMON CRY                             */
  /* ------------------------------------------------------------------------ */

  setTimeout(() => {
    //in the beginning
    document.querySelector("#pokemon-cry").play();
  }, 1000);
  function addSoundListener(){
    document.querySelector(".sound").addEventListener("click", () => {
    document
      .querySelector("#pokemon-cry")
      .play()
      .then(() => {
        document.querySelector(".sound").style.color = "rgb(196, 136, 132)";
      });
    });
    document.querySelector("#pokemon-cry").addEventListener("ended", () => {
      document.querySelector(".sound").style.color = "rgba(255, 255, 255, 0.5)";
    });
  }

  /* ------------------------------------------------------------------------ */
  /*                           AUTOSCROLL INTERFACE                           */
  /* ------------------------------------------------------------------------ */
  const firstContainer = document.querySelector(".sticky");
  const secondContainer = document.querySelector(".clip-scroller");

  let scrollerHidden = true;
  function autoScroll() {
    // Get the bounding rectangles of the containers
    const firstRect = firstContainer.getBoundingClientRect();
    const secondRect = secondContainer.getBoundingClientRect();
    // Calculate the difference in Y positions
    const diffY = secondRect.top - firstRect.bottom;
    console.log(diffY);
    // Calculate a smaller incremental scroll amount
    const increment = Math.abs(diffY) / 10; // Adjust the divisor for speed control
    console.log("incrementing", increment);
    // If the containers are not touching, scroll the document
    if (!isTouching(firstRect, secondRect)) {
      document.querySelector("#pokemon-info > div").scrollBy(0, increment);
      if (increment > 1) {
        // Only continue if we haven't reached the buffer zone
        requestAnimationFrame(autoScroll);
      } 
      else if (increment < 1) {
        document.querySelector("#auto-scroller").classList.add("fade");
        document
          .querySelectorAll(".scroll-arrows")
          .forEach((e) => e.classList.add("noanim"));

        // Reset the flag to allow future removals
        scrollerHidden = true;
      }
    }
  }
  function autoScrollVisibility(){
    const firstRect = firstContainer.getBoundingClientRect();
    const secondRect = secondContainer.getBoundingClientRect();
    const diffY = secondRect.top - firstRect.bottom;
    if(diffY > 9.984375 && scrollerHidden){
      document.querySelector("#auto-scroller").classList.remove("fade");
      document
        .querySelectorAll(".scroll-arrows")
        .forEach((e) => e.classList.remove("noanim"));
      scrollerHidden = false;
    }
    else if(diffY < 9.984375 && !scrollerHidden){
      document.querySelector("#auto-scroller").classList.add("fade");
      document
        .querySelectorAll(".scroll-arrows")
        .forEach((e) => e.classList.add("noanim"));
      // Reset the flag to allow future removals
      scrollerHidden = true;
    }
  }
  // Helper function to check if containers are touching
  function isTouching(rect1, rect2) {
    return (
      rect1.bottom >= rect2.top && rect1.bottom <= rect2.top + rect2.height
    );
  }

  function addAutoScrollInterfaceListener(){
    document.querySelector("#auto-scroller").addEventListener("click", autoScroll);
    document.querySelector('#pokemon-info > div').addEventListener("scroll", autoScrollVisibility);
  }

  /* ------------------------------------------------------------------------ */
  /*                               CLIP SCROLLER                              */
  /* ------------------------------------------------------------------------ */
  function updateClipPath() {
    const pokeinfo = document.querySelector("#pokemon-info > div");
    const windowScrollTop = pokeinfo.scrollTop;
    const elementToHide = document.querySelector(".clip-scroller");

    const iphone14 = window.matchMedia('(max-width: 430px)');
    const iphone12 = window.matchMedia('(max-width: 390px)');
    if(iphone12.matches){
      elementToHide.style.clipPath = `inset(${windowScrollTop - 315}px 0 0 0)`;
    }
    else if(iphone14.matches){
      elementToHide.style.clipPath = `inset(${windowScrollTop - 335}px 0 0 0)`;
    }
    else{
      elementToHide.style.clipPath = `inset(${windowScrollTop - 360}px 0 0 0)`;
    }
    
  }

  updateClipPath(); //update clip path on page load
  function addClipScrollListener() {
    const pokeinfo = document.querySelector("#pokemon-info > div");
    pokeinfo.addEventListener("scroll", updateClipPath);
  }
  
  setStyles(pokemon);
}

/* -------------------------------------------------------------------------- */
/*                               DYNAMIC STYLES                               */
/* -------------------------------------------------------------------------- */
function setElementStyles(element, cssProperty, value) {
  if (cssProperty.startsWith("--")) {
    // Use setProperty for custom properties
    element.forEach((el) => {
      el.style.setProperty(cssProperty, value);
      /* console.log("element", el.style.getPropertyValue(cssProperty)); */
    });
  } else {
    // Use the regular style property for non-custom properties
    element.forEach((el) => {
      el.style[cssProperty] = value;
      /* console.log("element", el.style[cssProperty]); */
    });
  }
}

function setStyles(pokemon) {
  console.log(pokemon.type);
  const doc = document.documentElement;
  const mainType = pokemon.type[0];
  const color = typeColors[mainType];
  const colorRGB = hexToRGB(color);
  if (!color) {
    console.warn(mainType + " is not a valid type");
    return;
  }
  /* ------------------------------------------------------------------------ */
  /*                              POKEMON WRAPPER                             */
  /* ------------------------------------------------------------------------ */
  const circle = document.querySelectorAll(".circle");

  const backgroundImage = document.querySelectorAll(".detail-bg");
  const image = document.querySelectorAll(".image");
  /* setElementStyles(background, 'background-color', `${color}`); */
  setElementStyles(
    circle,
    "background-image",
    `radial-gradient(rgba(255, 255, 255, 0), ${color} )`
  ) /* rgb(${colorRGB}) */;
  setElementStyles(circle, "border-color", color);
  const type = document.querySelectorAll(".type");
  type.forEach((typeOfElement) => {
    const typeColor = typeOfElement.innerText.toLowerCase();
    setElementStyles(
      [typeOfElement],
      /* "background-image",
      `radial-gradient(rgba(${colorRGB},0.2), ${typeColors[typeColor]})` */
      "background-color",
      `rgba(${hexToRGB(typeColors[typeColor])}, 0.5)`
    );
    setElementStyles([typeOfElement], "display", "inline-block");
  });

  /* -------------------------------------------------------------------------- */
  /*                                ABOUT WRAPPER                               */
  /* -------------------------------------------------------------------------- */
  const aboutWrapper = document.querySelector(".about-wrapper");
  /* const gridRowLine = document.querySelector(".grid-row-line"); */
  setElementStyles(
    [aboutWrapper],
    "background-color",
    `rgba(${colorRGB},0.5)` /* `radial-gradient(rgba(${colorRGB},0.2), ${color} )` */
  );
  setElementStyles([aboutWrapper], "border-color", color);
  /* setElementStyles([gridRowLine], "border-color", `rgba(${colorRGB},0.8)`); */

  /* -------------------------------------------------------------------------- */
  /*                                STATS WRAPPER                               */
  /* -------------------------------------------------------------------------- */
  const spanStatsWrapper = document.querySelectorAll(
    ".stats-wrapper-wrapper > span"
  );

  setElementStyles([doc], "--progress-bar-color", `rgba(${colorRGB},0.5)`);
  setElementStyles([doc], "--progress-value-color", color);
  setElementStyles(spanStatsWrapper, "border-color", color);

  // Function to animate progress bars

  // Modify the progress bar element to include a data attribute to track animation status
  function markAnimationStarted(progressBar) {
    progressBar.dataset.animationStarted = true;
  }

  function isAnimationStarted(progressBar) {
    return progressBar.dataset.animationStarted === "true";
  }
  function animateProgressBar(progressBar) {
    if (isAnimationStarted(progressBar)) {
      // If the animation has already started, do not restart it
      return;
    }

    markAnimationStarted(progressBar);

    const value = progressBar.getAttribute("value");
    let currentValue = 0;
    const animationDuration = 800; // Duration of the animation in milliseconds
    const animationStep = value / (animationDuration / 16); // Calculate the value to increase per frame

    const animation = setInterval(() => {
      if (currentValue >= value) {
        clearInterval(animation);
        progressBar.value = value; // Ensure the final value is set correctly
        // Reset the animation status when completed
        progressBar.dataset.animationStarted = false;
      } else {
        currentValue += animationStep;
        progressBar.value = currentValue;
      }
    }, 16); // Update every 16ms for smooth animation
  }

  // Set up the Intersection Observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const progressBar = entry.target.querySelector(".progress-bar");
          // Check if the animation has already started for this progress bar
          if (!isAnimationStarted(progressBar)) {
            animateProgressBar(progressBar);
            // Optionally, stop observing once the animation starts
            // observer.unobserve(entry.target);
          }
          //observer.unobserve(entry.target); // Stop observing once the animation starts
        }
      });
    },
    { threshold: 0.5 }
  ); // Start the animation when at least 50% of the progress bar is visible

  // Start observing each progress bar container
  document.querySelectorAll(".stats-wrapper-wrapper").forEach((container) => {
    observer.observe(container);
  });
  /* setElementStyles(progressBar, "background-color", "green"); */
  /* -------------------------------------------------------------------------- */
  /*                              EVOLUTION WRAPPER                             */
  /* -------------------------------------------------------------------------- */
  if (pokemon.evolutions.length > 3) {
    document.querySelector(".evolution-wrapper").style.justifyContent =
      "flex-end";
  } else if (pokemon.evolutions.length == 2) {
    document
      .querySelectorAll(".evolution-wrapper-wrapper")
      .forEach(
        (evo) =>
          (evo.style.flexBasis = `calc(90%/${pokemon.evolutions.length})`)
      );
  }
}

/* -------------------------------------------------------------------------- */
/*                                   FOOTER                                   */
/* -------------------------------------------------------------------------- */

// Get the current year
const currentYear = new Date().getFullYear();
console.log(document.getElementById("current-year"));
// Update the year in the footer
document.getElementById("current-year").textContent = currentYear;

