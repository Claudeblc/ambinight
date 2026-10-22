/* Liens affiliés Amazon : renseignez ici l'identifiant Partenaires Amazon (ex. « ambinight-21 »).
   Tant qu'il est vide, les liens mènent simplement aux fiches produits. */
window.AMAZON_TAG = '';

(function () {
  const tag = window.AMAZON_TAG;
  if (!tag) return;
  document.querySelectorAll('a[data-asin]').forEach((a) => {
    a.href = `https://www.amazon.fr/dp/${a.dataset.asin}?tag=${encodeURIComponent(tag)}`;
  });
})();
