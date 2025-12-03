console.log("scripts.js loaded");


document.addEventListener("DOMContentLoaded", () => {
  let authorLinks = document.querySelectorAll(".authorLink");

  for (let link of authorLinks) {
    link.addEventListener("click", getAuthorInfo);
  }
});

async function getAuthorInfo(event) {
  console.log("LINK CLICKED");  // <-- add this
  event.preventDefault();


  let authorId = this.dataset.id;

  // open modal
  let myModal = new bootstrap.Modal(document.getElementById("authorModal"));
  myModal.show();

  // fetch author info
  let response = await fetch(`/api/author/${authorId}`);
  let data = await response.json();
  let a = data[0];

  let authorInfo = document.querySelector("#authorInfo");
  authorInfo.innerHTML = `
    <h3>${a.firstName} ${a.lastName}</h3>
    <img src="${a.portrait}" width="200" class="mb-3"><br>
    <strong>Born:</strong> ${a.dob}<br>
    <strong>Died:</strong> ${a.dod ? a.dod : "Still living"}<br>
    <strong>Sex:</strong> ${a.sex}<br>
    <strong>Profession:</strong> ${a.profession}<br>
    <strong>Country:</strong> ${a.country}<br><br>
    <p><strong>Biography:</strong><br>${a.biography}</p>
  `;
}
