/* ========== EXPLORE HERO TABS ========== */

const exploreData = {
  stream: {
    label: "Stream",
    title: "Listen to the<br>Sound of Dust",
    description:
      "Explore the latest releases, timeless records, and sounds from the artists shaping the Dust Records catalogue.",
    button: "Start Streaming",
    link: "#music",
  },

  discover: {
    label: "Discover",
    title: "Meet the<br>Artists of Dust",
    description:
      "Discover the voices, personalities, and stories behind the music. From rising talent to established artists, there's always something new to find.",
    button: "Meet Our Artists",
    link: "#artists",
  },

  support: {
    label: "Support",
    title: "Support the<br>Music You Love",
    description:
      "Music grows through the people who listen, share, and show up. Support Dust Records and the artists behind the sound.",
    button: "Support Dust",
    link: "#support",
  },

  join: {
    label: "Be Part of It",
    title: "Become Part of<br>the Dust Story",
    description:
      "Dust Records is more than a label. Connect with us, collaborate, create, and become part of a growing creative movement.",
    button: "Get Involved",
    link: "#contact",
  },
};

const exploreItems = document.querySelectorAll(".explore-side li");

const exploreLabel = document.getElementById("explore-label");
const exploreTitle = document.getElementById("explore-title");
const exploreDescription = document.getElementById("explore-description");
const exploreButton = document.getElementById("explore-button");
const exploreContent = document.querySelector(".explore-content");

exploreItems.forEach((item) => {
  item.addEventListener("click", () => {
    const tab = item.dataset.tab;
    const data = exploreData[tab];

    if (!data) return;

    /* Don't animate if already active */
    if (item.classList.contains("active")) return;

    /* Remove active state */
    exploreItems.forEach((navItem) => {
      navItem.classList.remove("active");
    });

    /* Activate clicked item */
    item.classList.add("active");

    /* Fade content out */
    exploreContent.classList.add("changing");

    setTimeout(() => {
      /* Change content */
      exploreLabel.textContent = data.label;

      exploreTitle.innerHTML = data.title;

      exploreDescription.textContent = data.description;

      exploreButton.innerHTML = `${data.button} <i class="fa-solid fa-arrow-right"></i>`;

      exploreButton.href = data.link;

      /* Fade content back in */
      exploreContent.classList.remove("changing");
    }, 250);
  });
});
