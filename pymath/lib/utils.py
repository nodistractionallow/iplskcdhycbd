import os

def get_file_extension_from_path(path: str) -> str:
    """
    Extracts the file extension from a given file path.

    Args:
        path (str): The path to the file.

    Returns:
        str: The file extension (e.g., "txt", "jpg", "pdf") or an empty string if no extension is found.
    """
    if not isinstance(path, str):
        raise TypeError("Input path must be a string.")

    # Get the base name (file name with extension)
    basename = os.path.basename(path)

    # Handle hidden files like .bashrc correctly
    if basename.startswith('.') and basename.count('.') == 1:
        return basename[1:]

    # For other cases, use os.path.splitext
    _, ext = os.path.splitext(basename)
    return ext[1:] if ext else ""
