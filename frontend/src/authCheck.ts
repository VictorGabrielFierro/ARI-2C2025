export function checkToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "./index.html";
    }
}
export function getAuthHeaders(contentType = "application/json") {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No estás logueado");
    return {
        "Content-Type": contentType,
        "Authorization": `Bearer ${token}`
    };
}
