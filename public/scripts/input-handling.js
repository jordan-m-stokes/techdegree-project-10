const inputs = document.querySelectorAll('input');

inputs.forEach(input => 
{
    if(input.className === "error")
    {
        input.addEventListener("change", () => 
        {
            if(input.value)
            {
                input.className = "";
            }
            else
            {
                input.className = "error";
            }
        });
    }
});