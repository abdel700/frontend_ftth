export const fetchRegleData = async () => {
  const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/aggregated_regle/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données');
  }
  return await response.json();
};

export const fetchRegleDataAlternative = async () => {
  const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/regle/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données');
  }
  return await response.json();
};

export const fetchStockData = async () => {
  const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/stock/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données de stock');
  }
  return await response.json();
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/upload/', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Erreur lors de l\'upload du fichier');
  }

  return await response.json();
};

export const listFiles = async () => {
  const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/files/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des fichiers');
  }
  return await response.json();
};

export const deleteFile = async (fileId) => {
  const response = await fetch(`https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/delete/${fileId}/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du fichier');
  }

  return await response.json();
};

export const downloadFile = async (fileId) => {
  const response = await fetch(`https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/download/${fileId}/`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du fichier');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileId; // You might want to set a custom file name here
  document.body.appendChild(a); // Append anchor to body
  a.click();
  a.remove();
};
