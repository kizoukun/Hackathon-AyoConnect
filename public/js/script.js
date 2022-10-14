const searchForm = document.getElementById('search-form')
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const searchValue = document.getElementById('search-value').value;
    if(searchValue.length < 1) {
        Swal.fire({
            "icon": "error",
            "title": "Failed",
            "text": "Failed to search, value must be more than 1"
        })
        return;
    };
    window.location.href = "/subs/" + searchValue
})

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        console.log(entry)
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show');
        }
    });
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));